import { writable } from "svelte/store";
import { useLocalStorage } from "../utils";
import type { PeerId } from "./interfaces";

export let myUsername = useLocalStorage("username", "");

export let usernameStore = writable<Record<PeerId, string>>({});

export let connectedCountStore = createCount();

function createCount() {
	const { subscribe, update } = writable(0);

	return {
		subscribe,
		increment: () => update((n) => n + 1),
		decrement: () => update((n) => n - 1)
	};
}
