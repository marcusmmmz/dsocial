import type { Event, Sub } from "nostr-tools";

export function useThrottle(callback: () => any, time: number) {
	let throttlePause: boolean;

	const throttle = () => {
		if (throttlePause) return;

		throttlePause = true;

		callback();

		setTimeout(() => {
			throttlePause = false;
		}, time);
	};

	return {
		call: throttle,
		reset() {
			throttlePause = false;
		}
	};
}

export async function collectUntilEose(sub: Sub, callback: (e: Event) => any = () => {}) {
	return new Promise<Event[]>((resolve) => {
		let buffer: Event[] = [];
		let didEose = false;

		function onEvent(e: Event) {
			buffer.push(e);
			callback(e);
		}

		function onEose() {
			didEose = true;

			sub.off("event", onEvent);
			sub.off("eose", onEose);

			resolve(buffer);
		}

		sub.on("event", onEvent);
		sub.on("eose", onEose);
	});
}
