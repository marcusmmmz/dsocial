<script lang="ts">
	import Ably from "ably";

	import SimplePeer from "simple-peer";

	let form: HTMLFormElement;
	let incoming: HTMLTextAreaElement;
	let outgoing: HTMLPreElement;

	let initiator = location.hash === "#1";

	const p = new SimplePeer({
		initiator,
		trickle: false,
		config: {
			iceServers: [
				{
					urls: "stun:relay.metered.ca:80"
				},
				{
					urls: "turn:relay.metered.ca:80",
					username: "9fc0e8cda306a9300a33adb6",
					credential: "i8SqrXzkNWKYtdb1"
				},
				{
					urls: "turn:relay.metered.ca:443",
					username: "9fc0e8cda306a9300a33adb6",
					credential: "i8SqrXzkNWKYtdb1"
				},
				{
					urls: "turn:relay.metered.ca:443?transport=tcp",
					username: "9fc0e8cda306a9300a33adb6",
					credential: "i8SqrXzkNWKYtdb1"
				}
			]
		}
	});

	let ably = new Ably.Realtime("sA7Nqw.O15j_Q:kwempffC2VB5q_ObCL4ksMik3W36PLypgdKau2br7i8");

	let channel = ably.channels.get("jog-cup-act");

	p.on("error", (err) => {
		console.log("error", err);
		alert(err.cause + " " + err.name + "" + err.message);
	});

	p.on("signal", (data) => {
		console.log("SIGNAL", JSON.stringify(data));
		outgoing.textContent = JSON.stringify(data);
		aparecerBagulho = true;
		if (resolve) resolve(null);
	});

	p.on("connect", () => {
		console.log("CONNECT");
		p.send("whatever" + Math.random());
	});

	p.on("data", (data) => {
		console.log("data: " + data);
		alert("data: " + data);
	});

	let messages: string[] = [];

	let messageContent = "";

	function publishYourself() {
		console.log("published");
		channel.publish("offer", outgoing.textContent);

		channel.subscribe("answer", (msg) => {
			console.log(msg.name);
			console.log(msg.data);

			p.signal(msg.data);
		});
	}

	let resolve: (value: unknown) => void;
	let promise = new Promise((res, rej) => {
		resolve = res;
	});

	function searchPublishers() {
		console.log("searching");

		channel.subscribe("offer", async (msg) => {
			console.log(msg.name);
			console.log(msg.data);

			p.signal(msg.data);

			promise.then(() => {
				channel.publish("answer", outgoing.textContent);
			});
		});
	}

	let aparecerBagulho = false;
</script>

<button on:click={publishYourself}>publish yourself (#1)</button>
<button on:click={searchPublishers}>search publishers</button>

<!-- <form
	bind:this={form}
	on:submit={(ev) => {
		ev.preventDefault();
		p.signal(JSON.parse(incoming.value));
	}}
>
	<textarea
		bind:this={incoming}
		id="incoming"
		placeholder={"bota a " + (initiator ? "answer" : "offer") + " aqui"}
	/>
	<button type="submit">submit</button>
</form> -->

<!-- {#if aparecerBagulho}
	<p>manda isso pro outro:</p>
{/if} -->
<pre bind:this={outgoing} id="outgoing" />

<label>
	caixa de texto
	<input bind:value={messageContent} type="text" />
	<button
		on:click={() => {
			p.send(messageContent);
		}}>mandar</button
	>
</label>

{#each messages as msg}
	<p>{msg}</p>
{/each}

<style>
	#outgoing {
		width: 600px;
		word-wrap: break-word;
		white-space: normal;
	}
</style>
