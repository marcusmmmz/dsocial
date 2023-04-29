<script lang="ts">
	import type { PageData } from "./$types";
	import { onMount, tick } from "svelte";
	import { myUsername, usernameStore, myPubKey, myPrivKey, userPictureStore } from "$lib/stores";
	import type { IMessage, IProfile, Pubkey } from "$lib/interfaces";
	import { useThrottle } from "$lib/utils";
	import Message from "./Message.svelte";
	import { nip19, type Event, finishEvent, Kind } from "nostr-tools";
	import { MyKinds, nostrNow, relayList, relayPool } from "$lib/nostr";

	export let data: PageData;

	let decoded = nip19.decode(data.chatId).data;
	let kind40Id = (decoded as nip19.EventPointer).id ?? decoded;

	let typingTimeouts: Record<Pubkey, NodeJS.Timeout> = {};
	let messages: IMessage[] = [];
	let inputValue = "";
	let scrollEl: HTMLDivElement;

	$usernameStore[$myPubKey] = $myUsername;

	$: typingList = Object.keys(typingTimeouts);

	onMount(() => {
		Notification.requestPermission();

		let sub = relayPool.sub(relayList, [
			{
				kinds: [Kind.ChannelMessage],
				"#e": [kind40Id]
			}
		]);

		let buffer: Event[] = [];
		let didEoseAlready = false;

		sub.on("event", (e: Event) => {
			getProfile(e.pubkey);

			if (didEoseAlready) {
				appendMessage({
					id: e.id,
					chatId: e.tags[0][1],
					content: e.content,
					author: e.pubkey
				});

				if (typingTimeouts[e.pubkey]) {
					clearTimeout(typingTimeouts[e.pubkey]);
					delete typingTimeouts[e.pubkey];
					//force update
					typingTimeouts = typingTimeouts;
				}

				// only show notification after trying to get user's name
				getProfile(e.pubkey).then(() => {
					if (document.visibilityState == "hidden")
						new Notification($usernameStore[e.pubkey] ?? e.pubkey, {
							body: e.content
						});
				});
			} else {
				buffer.push(e);
			}
		});

		sub.on("eose", () => {
			didEoseAlready = true;

			buffer = buffer.sort((a, b) => a.created_at - b.created_at);

			messages = [
				...messages,
				...buffer.map((e) => ({
					id: e.id,
					chatId: e.tags[0][1],
					content: e.content,
					author: e.pubkey
				}))
			];
		});

		relayPool
			.sub(relayList, [
				{
					kinds: [Kind.EventDeletion],
					since: nostrNow(),
					"#c": [kind40Id]
				}
			])
			.on("event", (e: Event) => deleteMessage(e.tags[0][1]));

		relayPool
			.sub(relayList, [
				{
					kinds: [MyKinds.Typing],
					"#c": [kind40Id],
					since: nostrNow()
				}
			])
			.on("event", (e: Event) => {
				if (e.pubkey == $myPubKey) return;

				getProfile(e.pubkey);

				if (typingTimeouts[e.pubkey]) clearTimeout(typingTimeouts[e.pubkey]);

				typingTimeouts[e.pubkey] = setTimeout(() => {
					delete typingTimeouts[e.pubkey];
					//force update
					typingTimeouts = typingTimeouts;
				}, 3000);
			});
	});

	const { call: startTyping, reset: resetTyping } = useThrottle(
		() =>
			relayPool.publish(
				relayList,
				finishEvent(
					{
						content: "",
						created_at: nostrNow(),
						kind: MyKinds.Typing as number,
						tags: [["c", kind40Id]]
					},
					$myPrivKey
				)
			),
		1000
	);

	async function appendMessage(msg: IMessage) {
		messages = [...messages, msg];

		await tick();

		scrollEl.scrollIntoView({
			behavior: "smooth"
		});
	}

	function sendMessage() {
		resetTyping();

		let pub = relayPool.publish(
			relayList,
			finishEvent(
				{
					kind: Kind.ChannelMessage,
					content: inputValue,
					created_at: nostrNow(),
					tags: [["e", kind40Id, relayList[0], "root"]]
				},
				$myPrivKey
			)
		);

		pub.on("ok", (...a: any) => console.log("ok", a));
		pub.on("failed", (...a: any) => console.log("err", a));

		inputValue = "";
	}

	function onMyUsernameChanged() {
		function updateProfile(profile: Record<string, any>) {
			relayPool.publish(
				relayList,
				finishEvent(
					{
						content: JSON.stringify(profile),
						created_at: nostrNow(),
						kind: Kind.Metadata,
						tags: []
					},
					$myPrivKey
				)
			);
		}

		let sub = relayPool.sub(relayList, [
			{
				authors: [$myPubKey],
				kinds: [Kind.Metadata]
			}
		]);

		sub.on("event", (e: Event) => {
			updateProfile({
				...JSON.parse(e.content),
				name: $myUsername
			});
		});
		sub.on("eose", () => {
			updateProfile({ name: $myUsername });
		});

		$usernameStore[$myPubKey] = $myUsername;
	}

	function deleteMessage(id: string) {
		messages = messages.filter((msg) => msg.id !== id);
	}

	// TODO: optimize this
	async function getProfile(pubkey: Pubkey) {
		if ($usernameStore[pubkey] !== undefined) return $usernameStore[pubkey];

		let sub = relayPool.sub(relayList, [
			{
				authors: [pubkey],
				kinds: [Kind.Metadata],
				limit: 1
			}
		]);

		return new Promise<IProfile | null>((resolve) => {
			sub.on("event", (e: Event) => {
				let parsed = JSON.parse(e.content);

				$usernameStore[pubkey] = parsed.name;
				$userPictureStore[pubkey] = parsed.picture;

				resolve({
					username: parsed.name,
					picture: parsed.picture
				});
			});
			sub.on("eose", () => resolve(null));
		});
	}
</script>

<div class="chat">
	<div class="top-bar">
		<div class="profile-bar">
			<input
				placeholder="username"
				on:change={onMyUsernameChanged}
				bind:value={$myUsername}
				type="text"
			/>
			<p>{nip19.npubEncode($myPubKey)}</p>
		</div>

		<div class="chat-name">
			<p>{data.chatId}</p>
		</div>
	</div>

	<div class="message-list">
		{#each messages as message, i (message.id)}
			<Message
				on:deleted={() => deleteMessage(message.id)}
				{message}
				short={messages[i - 1]?.author == message.author}
			/>
		{/each}

		<div bind:this={scrollEl} />
	</div>
	{#if typingList.length > 0}
		<div>
			typing: {typingList.map((id) => $usernameStore[id] ?? id).join(", ")}
		</div>
	{/if}
	<div class="input-bar">
		<input
			type="text"
			bind:value={inputValue}
			on:keydown={(e) => {
				if (e.key == "Enter") sendMessage();
			}}
			on:input={() => {
				if (inputValue.trim() != "") startTyping();
			}}
		/>

		<button on:click={sendMessage}> send</button>
	</div>
</div>

<style>
	.chat {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
		width: calc(100% - 64px);
		/* width: auto; */
		background-color: #303339;
	}
	.top-bar {
		display: flex;
		flex-direction: column;
		gap: 1em;
		border-bottom: 2px solid #282c2c;
		padding: 1em 1em 0 1em;
	}
	.input-bar {
		display: grid;
		grid-template-columns: auto 20%;
		gap: 1em;
		height: 10%;
		padding: 0 1em 1em 1em;
	}
	.chat-name {
		text-align: center;
	}
	.profile-bar {
		text-align: center;
		display: grid;
		grid-template-columns: 20% auto;
	}
	.message-list {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 8px;
		/* justify-content: start; */
		overflow-y: scroll;
		/* overflow-x: hidden; */
		padding-bottom: 16px;
		/* padding-right: 16px; */
		/* margin-right: 16px; */
	}
	input,
	button {
		background-color: #393a41;
		color: white;
		border: 0 solid;
	}
	button:hover {
		cursor: pointer;
	}
	button:active {
		background-color: #282c2c;
	}
</style>
