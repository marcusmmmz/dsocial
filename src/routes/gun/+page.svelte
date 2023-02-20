<!-- <script lang="ts">
	import Gun from "gun";
	import "gun/lib/webrtc";
	import "gun/sea";

	let gun = new Gun(["https://gun-manhattan.herokuapp.com/gun"]);
	let user = gun.user();

	let myAlias = "mmm";
	let myPassphrase = "passphrase";

	function signUp() {
		let a = user.create(myAlias, myPassphrase, (ack) => {
			console.log(ack);
		});

		console.log(a);
	}

	function login() {
		let a = user.auth(myAlias, myPassphrase, (ack) => {
			console.log(ack);
		});

		console.log(a);
	}

	function submit() {
		if (!user.is) return;

		// @ts-expect-error
		user.get("said").set("valor");

		gun.get("teste").put(
			{
				name: "valorteste"
			},
			(ack) => {
				console.log(ack);
			}
		);
	}

	gun.on("auth", () => {
		user
			.get("said")
			.map()
			.once((say, id) => {
				console.log(say, id);
			});

		gun.get("teste").on((data) => {
			console.log(data);
		});
	});
</script>

<input type="text" bind:value={myAlias} />
<input type="text" bind:value={myPassphrase} />

<button on:click={signUp}> sign up </button>
<button on:click={login}> login </button>
<button on:click={submit}> submit </button> -->
<script lang="ts">
	import { onMount } from "svelte";
	import Gun from "gun";
	import "gun/sea";
	import "gun/lib/webrtc";

	let myAlias = "";
	let myPassphrase = "";
	let inputText = "";

	var gun = Gun([
		/*""https://gun-manhattan.herokuapp.com/gun",*/
		"http://localhost:8000/gun"
	]);

	let user = gun.user();

	function signUp() {
		user.create(myAlias, myPassphrase, console.log);
	}

	function login() {
		user.auth(myAlias, myPassphrase);
	}

	function submit() {
		if (!user.is) return;

		// @ts-expect-error
		gun.get("teste").set(inputText);
		inputText = "";
	}

	function UI(data: string, key: string) {
		messages = [...messages, `${key}: ${data}`];
	}

	// gun.on("auth", ()=> {

	// });

	onMount(() => {
		gun.get("teste").map().on(UI);
	});

	let messages: string[] = [];
</script>

<input type="text" bind:value={myAlias} />
<input type="text" bind:value={myPassphrase} />

<button on:click={signUp}> sign up </button>
<button on:click={login}> login </button>
<button on:click={submit}> submit </button>

<ul>
	{#each messages as message}
		<li>{message}</li>
	{/each}
</ul>
