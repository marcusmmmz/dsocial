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

	$: parsed = parseEmojis(message.content);
	$: bigEmoji = parsed.every((piece) => emojis[piece] != undefined);
</script>

<div class="message">
	<div class="author">{author}</div>
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

<style>
	.message {
		margin-top: 9px;
		padding: 8px 16px;
	}
	.message:hover {
		background-color: #2f3135;
	}
	.author {
		font-weight: 500;
	}
	.content {
		font-weight: 400;
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
