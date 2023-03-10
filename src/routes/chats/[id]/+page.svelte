<script lang="ts">
	import type { PageData } from "./$types";
	import { onMount, tick } from "svelte";
	import { broadcast, connections, myId, onPeerConnect, unicast } from "$lib/webrtc";
	import { connectedCountStore, myUsername, usernameStore } from "$lib/stores";
	import type { PeerId } from "$lib/interfaces";
	import { useThrottle } from "$lib/utils";
	import Message from "./Message.svelte";
	import { publishYourself, searchPublishers, setSignalingChannel } from "$lib/signaling";

	interface IMessage {
		author: string;
		content: string;
	}

	export let data: PageData;

	let typingTimeouts: Record<PeerId, NodeJS.Timeout> = {};
	let messages: IMessage[] = [];
	let inputValue = "";
	let scrollEl: HTMLDivElement;

	setSignalingChannel(`chat-${data.chatId}`);
	$usernameStore[myId] = $myUsername;

	$: typingList = Object.keys(typingTimeouts);

	onMount(() => {
		searchPublishers();
		Notification.requestPermission();
	});

	onPeerConnect((id) => {
		const conn = connections[id];

		appendMessage({
			author: "",
			content: `${id} entrou no chat`
		});

		if ($myUsername.trim() != "") unicast(id, "username", $myUsername);

		conn
			.on("data", (rawData) => {
				const { type, data } = JSON.parse(rawData);

				if (type == "message") {
					let content: string = data;

					appendMessage({
						author: id,
						content
					});

					if (document.visibilityState == "hidden")
						new Notification($usernameStore[id] ?? id, {
							body: content
						});

					if (typingTimeouts[id]) {
						clearTimeout(typingTimeouts[id]);
						delete typingTimeouts[id];
						//force update
						typingTimeouts = typingTimeouts;
					}
				} else if (type == "username") {
					let username: string = data;

					onUsernameChanged(id, username);
				} else if (type == "typing") {
					if (typingTimeouts[id]) clearTimeout(typingTimeouts[id]);

					typingTimeouts[id] = setTimeout(() => {
						delete typingTimeouts[id];
						//force update
						typingTimeouts = typingTimeouts;
					}, 3000);
				}
			})
			.on("close", () => {
				appendMessage({
					author: "",
					content: `${$usernameStore[id] ?? id} saiu do chat`
				});
			});
	});

	const { call: startTyping, reset: resetTyping } = useThrottle(
		() => broadcast("typing", true),
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
		broadcast("message", inputValue);
		appendMessage({
			author: myId,
			content: inputValue
		});
		inputValue = "";
	}

	function onMyUsernameChanged() {
		broadcast("username", $myUsername);
		onUsernameChanged(myId, $myUsername);
	}

	function onUsernameChanged(id: PeerId, username: string) {
		$usernameStore[id] = username;
	}
</script>

<svelte:window
	on:unload={() => {
		for (const conn of Object.values(connections)) {
			conn.destroy();
		}
	}}
/>

<div class="main">
	<div class="top-bar">
		<div class="status-bar">
			<input
				placeholder="username"
				on:change={onMyUsernameChanged}
				bind:value={$myUsername}
				type="text"
			/>
			<p>{myId}</p>
			<p>{$connectedCountStore} conectados</p>
		</div>

		<div class="connect-bar">
			<input
				value={data.chatId}
				on:change={(e) => {
					// navigate and reload page
					window.location.href = `/chats/${e.currentTarget.value}`;
				}}
				type="text"
			/>
			<button on:click={publishYourself}>auto-connect</button>
		</div>
	</div>

	<div class="message-list">
		{#each messages as message, i}
			<Message {message} short={messages[i - 1]?.author == message.author} />
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
			on:input={startTyping}
		/>

		<button on:click={sendMessage}> send</button>
	</div>
</div>

<style>
	:global(body, html) {
		height: 100%;
		margin: 0;
	}
	.main {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
		background-color: #303339;
		color: white;
		font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
	}
	.top-bar {
		background-color: gray;
	}
	.input-bar {
		display: grid;
		grid-template-columns: auto 20%;
		background-color: darkcyan;
	}
	.input-bar input {
		height: 5vh;
	}
	.connect-bar {
		display: grid;
		grid-template-columns: auto 20%;
	}
	.connect-bar input {
		height: 5vh;
	}
	.status-bar {
		text-align: center;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		background-color: darkgrey;
		color: black;
	}
	.message-list {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: start;
		overflow-y: scroll;
		padding-bottom: 16px;
	}
</style>
