<script lang="ts">
	import type { PageData } from "./$types";
	import { onMount, tick } from "svelte";
	import { myUsername, usernameStore, myPubKey, myPrivKey } from "$lib/stores";
	import type { IMessage, Pubkey } from "$lib/interfaces";
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
			getUsername(e.pubkey);

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
					since: nostrNow()
				}
			])
			.on("event", (e: Event) => {
				if (e.pubkey == $myPubKey) return;

				getUsername(e.pubkey);

				if (typingTimeouts[e.pubkey]) clearTimeout(typingTimeouts[e.pubkey]);

				typingTimeouts[e.pubkey] = setTimeout(() => {
					delete typingTimeouts[e.pubkey];
					//force update
					typingTimeouts = typingTimeouts;
				}, 3000);
			});
	});

	// onPeerConnect((id) => {
	// 	const conn = connections.get(id);

	// 	appendMessage({
	// 		author: "",
	// 		content: `${id} entrou no chat`
	// 	});

	// 	if ($myUsername.trim() != "") unicast(id, "username", $myUsername);

	// 	conn
	// 		?.on("data", (rawData) => {
	// 			const { type, data } = JSON.parse(rawData);

	// 			if (type == "message") {
	// 				let content: string = data;

	// 				appendMessage({
	// 					author: id,
	// 					content
	// 				});

	// 				if (document.visibilityState == "hidden")
	// 					new Notification($usernameStore[id] ?? id, {
	// 						body: content
	// 					});

	// 				if (typingTimeouts[id]) {
	// 					clearTimeout(typingTimeouts[id]);
	// 					delete typingTimeouts[id];
	// 					//force update
	// 					typingTimeouts = typingTimeouts;
	// 				}
	// 			} else if (type == "username") {
	// 				let username: string = data;

	// 				onUsernameChanged(id, username);
	// 			} else if (type == "typing") {
	// 				if (typingTimeouts[id]) clearTimeout(typingTimeouts[id]);

	// 				typingTimeouts[id] = setTimeout(() => {
	// 					delete typingTimeouts[id];
	// 					//force update
	// 					typingTimeouts = typingTimeouts;
	// 				}, 3000);
	// 			}
	// 		})
	// 		.on("close", () => {
	// 			appendMessage({
	// 				author: "",
	// 				content: `${$usernameStore[id] ?? id} saiu do chat`
	// 			});
	// 		});
	// });

	const { call: startTyping, reset: resetTyping } = useThrottle(
		() =>
			relayPool.publish(
				relayList,
				finishEvent(
					{
						content: "",
						created_at: nostrNow(),
						kind: MyKinds.Typing as number,
						tags: [["#c", kind40Id]]
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
		// broadcast("username", $myUsername);
		onUsernameChanged($myPubKey, $myUsername);
	}

	function onUsernameChanged(id: Pubkey, username: string) {
		$usernameStore[id] = username;
	}

	function deleteMessage(id: string) {
		messages = messages.filter((msg) => msg.id !== id);
	}

	// TODO: optimize this
	function getUsername(pubkey: Pubkey) {
		if ($usernameStore[pubkey] == undefined) {
			relayPool
				.sub(relayList, [
					{
						authors: [pubkey],
						kinds: [Kind.Metadata],
						limit: 1
					}
				])
				.on("event", (e: Event) => {
					let parsed = JSON.parse(e.content);

					$usernameStore[pubkey] = parsed.name;
				});
		}
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
		{#each messages as message, i}
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
		width: 100%;
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
		display: flex;
		flex-direction: column;
		justify-content: start;
		overflow-y: scroll;
		padding-bottom: 16px;
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
