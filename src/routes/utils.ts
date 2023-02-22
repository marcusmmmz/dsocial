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
