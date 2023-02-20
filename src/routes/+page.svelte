<script lang="ts">
	import { onMount, tick } from "svelte";
	import Message from "./Message.svelte";
	import { connections, myId, onPeerConnect, publishYourself, searchPublishers } from "./webrtc";
	import { connectedCountStore, myUsername, usernameStore } from "./stores";
	import type { PeerId } from "./interfaces";

	interface IMessage {
		author: string;
		content: string;
	}

	let inputValue = "";

	let messages: IMessage[] = [];

	let messagesDiv: HTMLDivElement;

	$usernameStore[myId] = $myUsername;

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
				} else if (type == "username") {
					let username: string = data;

					onUsernameChanged(id, username);
				}
			})
			.on("close", () => {
				appendMessage({
					author: "",
					content: `${$usernameStore[id] ?? id} saiu do chat`
				});
			});
	});

	function broadcast(type: string, data: any) {
		Object.values(connections).forEach((peer) => {
			peer.send(
				JSON.stringify({
					type,
					data
				})
			);
		});
	}

	function unicast(peerId: string, type: string, data: any) {
		const peer = connections[peerId];

		peer.send(
			JSON.stringify({
				type,
				data
			})
		);
	}

	async function appendMessage(msg: IMessage) {
		messages = [...messages, msg];

		await tick();

		if (messagesDiv.lastElementChild)
			messagesDiv.lastElementChild.scrollIntoView({
				behavior: "smooth"
			});
	}

	function sendMessage() {
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
			<button on:click={publishYourself}>auto-connect</button>
		</div>
	</div>

	<div bind:this={messagesDiv} class="message-list">
		{#each messages as message}
			<Message {message} />
		{/each}
	</div>

	<div class="input-bar">
		<input
			type="text"
			bind:value={inputValue}
			on:keydown={(e) => {
				if (e.key == "Enter") sendMessage();
			}}
		/>

		<button on:click={sendMessage}> send</button>
	</div>
</div>

<style>
	.main {
		background-color: #38343c;
		color: white;
	}

	.top-bar {
		background-color: gray;
	}
	.input-bar {
		display: grid;
		grid-template-columns: auto 20%;
		background-color: darkcyan;
	}

	.connect-bar {
		display: grid;
		gap: 16px;
		grid-template-columns: 1fr;
	}
	input {
		width: 100%;
	}
	.status-bar {
		text-align: center;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		background-color: darkgrey;
		color: black;
	}

	:global(body, html) {
		height: 100%;
		margin: 0;
	}

	.main {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
	}
	.message-list {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: start;
		overflow-y: scroll;
	}
</style>
