<script lang="ts">
	import type { IMessage } from "$lib/interfaces";
	import { nostrNow, relayList, relayPool } from "$lib/nostr";
	import { myPrivKey, myPubKey, userPictureStore, usernameStore } from "$lib/stores";
	import { Kind, finishEvent } from "nostr-tools";
	import { createEventDispatcher } from "svelte";

	export let message: IMessage;

	$: author = $usernameStore[message.author] ?? message.author;
	$: picture =
		$userPictureStore[message.author] ||
		"https://cdn.discordapp.com/emojis/1048253883039875122.png";

	export let short = false;

	let dispatch = createEventDispatcher();

	let showActions = false;

	const emojis: Record<string, string> = {
		":pexe:": "https://cdn.discordapp.com/emojis/1048253883039875122.png",
		":anjo:": "https://cdn.discordapp.com/emojis/1037427525690871899.png"
	};

	function parseEmojis(content: string) {
		// this regex splits on colons but also maintains them
		let list = content.split(/(:)/g).filter((v) => v != "");

		let newList = [];
		let i = 0;

		while (list.length > i) {
			let element = list[i];

			if (
				element == ":" &&
				list[i + 1] != undefined &&
				list[i + 1] != ":" &&
				list[i + 2] != undefined &&
				list[i + 2] == ":"
			) {
				newList.push(element + list[i + 1] + list[i + 2]);
				i += 3;
			} else {
				newList.push(element);
				i++;
			}
		}

		return newList;
	}

	$: parsed = parseEmojis(message.content);
	$: bigEmoji = parsed.every((piece) => emojis[piece] != undefined);

	function deleteMessage() {
		relayPool
			.publish(
				relayList,
				finishEvent(
					{
						content: "",
						kind: Kind.EventDeletion,
						created_at: nostrNow(),
						tags: [
							["e", message.id],
							// non-standard tag
							["c", message.chatId]
						]
					},
					$myPrivKey
				)
			)
			.on("ok", () => dispatch("deleted"));
	}
</script>

<div
	on:pointerenter={() => (showActions = message.author == $myPubKey)}
	on:pointerleave={() => (showActions = false)}
	class="message"
	class:short
>
	{#if !short}
		<img src={picture} alt="" />
	{/if}
	<div class="message-container">
		{#if !short}
			<div class="author">{author}</div>
		{/if}
		<div class="content">
			{#each parsed as piece}
				{#if emojis[piece]}
					<img class="emoji" class:big={bigEmoji} src={emojis[piece]} alt={piece} />
				{:else}
					{piece}
				{/if}
			{/each}
		</div>
	</div>
	{#if showActions}
		<div>
			<button on:click={deleteMessage}>delete</button>
		</div>
	{/if}
</div>

<style>
	.message {
		padding: 16px;
		padding-bottom: 0;
		display: flex;
		gap: 16px;
	}
	img {
		width: 40px;
		height: 40px;
		border-radius: 100%;
	}
	.message.short {
		padding: 0 16px;
		padding-left: calc(40px + 32px);
	}
	.message:hover {
		background-color: #2f3135;
	}
	.author {
		font-weight: 400;
	}
	.content {
		font-weight: 300;
	}
	button {
		border-width: 0 1px 0 1px;
	}
	.emoji {
		vertical-align: top;
		width: 22px;
		height: 22px;
		object-fit: contain;
	}
	.big.emoji {
		width: 48px;
		height: 48px;
		object-fit: contain;
	}
</style>
