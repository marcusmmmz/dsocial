import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	resolve: {
		alias: {
		  // ...
		  "simple-peer": "simple-peer/simplepeer.min.js",
		},
	  },
};

export default config;
