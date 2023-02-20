import { writable, type Updater } from "svelte/store";
import { browser } from "$app/environment";
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

export function useLocalStorage<T>(
	key: string,
	initialValue: T,
	serialize: (value: T) => string = JSON.stringify,
	deserialize: (value: string) => T = JSON.parse
) {
	if (!browser) return writable(initialValue);

	let serializedValue = localStorage.getItem(key);

	let store = writable(serializedValue == null ? initialValue : deserialize(serializedValue));

	function save(value: T) {
		localStorage.setItem(key, serialize(value));
	}

	return {
		subscribe: store.subscribe,
		set(value: T) {
			store.set(value);
			save(value);
		},
		update(updater: Updater<T>) {
			store.update((value) => {
				save(value);
				return updater(value);
			});
		}
	};
}
