<script lang="ts">
	import { goto } from "$app/navigation";
	import { relayList, relayPool } from "$lib/nostr";
	import { myPrivKey } from "$lib/stores";
	import { Kind, finishEvent } from "nostr-tools";

	let chatInfo = {
		name: "",
		about: "",
		picture: ""
	};

	let chatId = "";

	function createChat() {
		relayPool
			.publish(
				relayList,
				finishEvent(
					{
						kind: Kind.ChannelCreation,
						content: JSON.stringify(chatInfo),
						created_at: Date.now() / 1000,
						tags: []
					},
					$myPrivKey
				)
			)
			.on("ok", () => goto(`/chats/${chatId}`));
	}
</script>

<div class="background">
	<div class="container">
		<h2>Create chat</h2>
		<label>
			Chat name
			<input type="text" bind:value={chatInfo.name} />
		</label>
		<label>
			Chat description
			<input type="text" bind:value={chatInfo.about} />
		</label>
		<label>
			Chat picture (URL)
			<input type="text" bind:value={chatInfo.picture} />
		</label>
		<button on:click={createChat}>Create</button>

		<hr />

		<h2>Join chat</h2>
		<label>
			Chat id
			<input type="text" bind:value={chatId} />
		</label>
		<a href="/chats/{chatId}"><button>Join</button></a>
	</div>
</div>

<style>
	.background {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background-color: #303339;
		width: 100%;
	}
	.container {
		display: flex;
		flex-direction: column;
		gap: 4px;
		text-align: center;
		width: 50%;
	}
	label {
		display: flex;
		flex-direction: column;
		justify-content: stretch;
		text-align: start;
	}
	.container > button,
	a {
		margin-top: 16px;
		align-self: center;
	}
	hr {
		width: 100%;
		margin: 16px 0;
	}
</style>
