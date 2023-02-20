<script lang="ts">
	import type { IMessage } from "./new/interfaces";
	import { usernameStore } from "./new/stores";

	export let message: IMessage;

	$: author = $usernameStore[message.author] ?? message.author;

	let content = message.content.replace(
		":pexe:",
		'<img src="https://cdn.discordapp.com/emojis/1048253883039875122.png?size=24"></img>'
	);
</script>

<div><strong>{author}</strong></div>
<div>{@html content}</div>

<style>
</style>
