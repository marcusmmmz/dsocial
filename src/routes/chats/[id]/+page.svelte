<script lang="ts">
	import type { PageData } from "./$types";
	import Chat from "$lib/chat/Chat.svelte";
	import { myPrivKey } from "$lib/stores";
	import { Kind, finishEvent, nip19, type Event } from "nostr-tools";
	import { nostrNow, relayList, relayPool } from "$lib/nostr";

	export let data: PageData;

	let decoded = nip19.decode(data.chatId).data;
	let kind40Id = (decoded as nip19.EventPointer).id ?? decoded;

	let inputValue: string;

	async function eventToMessage(e: Event) {
		return {
			content: e.content,
			author: e.pubkey,
			chatId: kind40Id,
			createdAt: e.created_at,
			id: e.id
		};
	}

	function listenForMessages() {
		return relayPool.sub(relayList, [
			{
				kinds: [Kind.ChannelMessage],
				"#e": [kind40Id]
			}
		]);
	}

	async function getMessageToSend() {
		return finishEvent(
			{
				kind: Kind.ChannelMessage,
				content: inputValue,
				created_at: nostrNow(),
				tags: [["e", kind40Id, relayList[0], "root"]]
			},
			$myPrivKey
		);
	}
</script>

<Chat {listenForMessages} {eventToMessage} {getMessageToSend} bind:inputValue chatId={kind40Id} />
