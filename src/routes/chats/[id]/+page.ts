import type { PageLoad } from "./$types";

export const load = (async ({ params }) => {
	return {
		chatId: params.id
	};
}) satisfies PageLoad;
