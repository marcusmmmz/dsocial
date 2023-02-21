<script lang="ts">
	import type { IMessage } from "./interfaces";
	import { usernameStore } from "./stores";

	export let message: IMessage;

	$: author = $usernameStore[message.author] ?? message.author;

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
</script>

<div><strong>{author}</strong></div>
<div>
	{#each parseEmojis(message.content) as piece}
		{#if emojis[piece]}
			<img
				class={message.content == `${piece}` ? "big emoji" : "emoji"}
				src={emojis[piece]}
				alt={piece}
			/>
		{:else}
			{piece}
		{/if}
	{/each}
</div>

<style>
	.emoji {
		vertical-align: top;
		width: 22px;
		height: auto;
	}

	.big.emoji {
		width: 4em;
	}
</style>
