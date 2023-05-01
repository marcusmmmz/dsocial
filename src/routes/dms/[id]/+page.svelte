<script lang="ts">
	import type { PageData } from "./$types";
	import Chat from "$lib/chat/Chat.svelte";
	import { myPrivKey, myPubKey } from "$lib/stores";
	import { Kind, finishEvent, nip04, nip19, type Event } from "nostr-tools";
	import { nostrNow, relayList, relayPool } from "$lib/nostr";

	export let data: PageData;

	let decoded = nip19.decode(data.chatId).data;
	let otherPubkey = (decoded as nip19.ProfilePointer).pubkey;

	let inputValue: string;

	async function eventToMessage(e: Event) {
		let otherPubkey = e.pubkey == $myPubKey ? e.tags[0][1] : e.pubkey;

		let content = await nip04.decrypt($myPrivKey, otherPubkey, e.content);

		return {
			content,
			author: e.pubkey,
			chatId: otherPubkey,
			createdAt: e.created_at,
			id: e.id
		};
	}

	function listenForMessages() {
		return relayPool.sub(relayList, [
			{
				kinds: [Kind.EncryptedDirectMessage],
				authors: [otherPubkey],
				"#p": [$myPubKey]
			},
			{
				kinds: [Kind.EncryptedDirectMessage],
				authors: [$myPubKey],
				"#p": [otherPubkey]
			}
		]);
	}

	async function getMessageToSend() {
		let encryptedText = await nip04.encrypt($myPrivKey, otherPubkey, inputValue);

		return finishEvent(
			{
				kind: Kind.EncryptedDirectMessage,
				content: encryptedText,
				created_at: nostrNow(),
				tags: [["p", otherPubkey]]
			},
			$myPrivKey
		);
	}
</script>

<Chat
	{listenForMessages}
	{eventToMessage}
	{getMessageToSend}
	bind:inputValue
	chatId={otherPubkey}
/>
