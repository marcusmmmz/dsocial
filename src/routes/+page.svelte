<script lang="ts">
	import type { DataConnection } from "peerjs";
	import Message from "./Message.svelte";
	import { Peer } from "peerjs";
	import { browser } from "$app/environment";
	import { useLocalStorage } from "./utils";

	let myPeer: Peer;

	let lastConnectedPeers = useLocalStorage<string[]>("lastConnectedPeers", []);

	let myPeerId = useLocalStorage<string>(
		"peerId",
		undefined as any,
		(t) => t,
		(t) => t
	);

	if (browser)
		myPeer = new Peer($myPeerId)
			.on("open", (id) => {
				$myPeerId = id;

				setTimeout(() => {
					$lastConnectedPeers.forEach((peer) => {
						if (Object.values(conns).find((conn) => conn.peer == peer)) return;

						connect(peer);
					});
				}, 2000);
			})
			.on("connection", (conn) => {
				conns[conn.connectionId] = conn;

				conn.on("data", onData);

				conn.on("close", () => {
					alert("banana");
				});

				appendMessage(`${conn.peer} entrou no chat`);
			})
			.on("disconnected", (id) => {
				delete conns[id];
				appendMessage(`${id} saiu do chat`);
			});

	let conns: Record<string, DataConnection> = {};

	let messages: string[] = [];

	let peerInputValue = "";
	let messageInputValue = "vai se fuder mlk chato da porra é sério pqp";

	function onData(data: unknown) {
		appendMessage(data as string);
	}

	function broadcast(data: any) {
		Object.values(conns).forEach((peer) => peer.send(data));
	}

	function connect(peerId: string) {
		let conn = myPeer.connect(peerId);

		conn
			.on("open", () => {
				appendMessage(`${conn.peer} entrou no chat`);

				if (!$lastConnectedPeers.includes(conn.peer))
					$lastConnectedPeers = [...$lastConnectedPeers, conn.peer];

				conns[conn.connectionId] = conn;
			})
			.on("close", () => {
				delete conns[conn.peer];
				appendMessage(`${conn.peer} saiu do chat`);
			})
			.on("data", onData);

		peerInputValue = "";
	}

	function appendMessage(msg: string) {
		messages = [...messages, msg];
	}

	function sendMessage() {
		broadcast(messageInputValue);
		appendMessage(messageInputValue);
		messageInputValue = "";
	}
</script>

<div class="main">
	<div class="top-bar">
		<div class="status-bar">
			<p>{$myPeerId}</p>
			<p>{Object.values(conns).length} conectados</p>
		</div>

		<div class="connect-bar">
			<input type="text" bind:value={peerInputValue} />
			<button on:click={() => connect(peerInputValue)}> connect </button>
		</div>
	</div>

	<div class="message-list">
		{#each messages as message}
			<Message {message} />
		{/each}
	</div>

	<div class="input-bar">
		<input
			type="text"
			bind:value={messageInputValue}
			on:keydown={(e) => {
				if (e.key == "Enter") sendMessage();
			}}
		/>

		<button on:click={sendMessage}> send</button>
	</div>
</div>

<style>
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
		grid-template-columns: auto 20%;
	}
	input {
		width: 100%;
	}
	.status-bar {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		background-color: darkgrey;
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
