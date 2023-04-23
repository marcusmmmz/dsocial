import { SimplePool } from "nostr-tools";

export let relayPool = new SimplePool();

export let relayList = [
	"wss://nostr-pub.wellorder.net",
	"wss://brb.io",
	"wss://nostr.zebedee.cloud",
	"wss://relay.nostr.band",
	"wss://nos.lol"
];

export function nostrNow() {
	return Math.floor(Date.now() / 1000);
}
