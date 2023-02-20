<script lang="ts">
	import Ably from "ably";

	let ably = new Ably.Realtime("sA7Nqw.O15j_Q:kwempffC2VB5q_ObCL4ksMik3W36PLypgdKau2br7i8");

	import SimplePeer from "simple-peer";

	let connections: Record<string, SimplePeer.Instance> = {};

	let signalingChannel = ably.channels.get("auto-connect");

	// change this to assymetric keys when security is needed
	// right now an attacker could stop people from connecting
	let myId = Math.random().toString(); //crypto.randomUUID();

	const iceServers = [
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
	];

	function publishYourself() {
		signalingChannel.publish("online", myId);
		console.log("1", myId);

		let myChannel = ably.channels.get(myId);

		myChannel.subscribe("offer", (msg) => {
			console.log("2", msg.data);
			let peer = new SimplePeer({
				trickle: false,
				config: {
					iceServers
				}
			});

			setupPeer(peer);

			connections[msg.data.id] = peer;

			peer.signal(msg.data.offer);

			peer.on("signal", (data) => {
				let otherPeerChannel = ably.channels.get(msg.data.id);

				otherPeerChannel.publish("answer", data);
				console.log("3", data);
			});
		});
	}

	function searchPublishers() {
		signalingChannel.subscribe("online", (msg) => {
			console.log("1", msg.data);
			let peerChannel = ably.channels.get(msg.data);

			let peer = new SimplePeer({
				initiator: true,
				trickle: false,
				config: {
					iceServers
				}
			});

			setupPeer(peer);

			connections[msg.data.id] = peer;

			peer.on("signal", (data) => {
				peerChannel.publish("offer", {
					id: myId,
					offer: data
				});

				console.log("2", {
					id: myId,
					offer: data
				});

				let myChannel = ably.channels.get(myId);

				myChannel.subscribe("answer", (msg) => {
					peer.signal(msg.data);
					console.log("3", msg.data);
				});
			});
		});
	}

	function setupPeer(peer: SimplePeer.Instance) {
		peer.on("connect", () => {
			console.log("CONNECT");
			peer.send("whatever" + Math.random());
		});

		peer.on("data", (data) => {
			console.log("data: " + data);
			messages.push(data);
			// alert("data: " + data);
		});

		peer.on("error", (err) => {
			console.log(err);
			alert(err.cause + " " + err.name + "" + err.message);
		});
	}

	let inputValue = "";

	let messages: string[] = [];
</script>

<button on:click={publishYourself}>publish yourself</button>
<button on:click={searchPublishers}>search publishers</button>

<br />

<input bind:value={inputValue} type="text" />

<button
	on:click={() => {
		Object.values(connections).forEach((conn) => conn.send(inputValue));
		connections[0].send(inputValue);
		messages.push(inputValue);
	}}>mandar msg</button
>

{#each messages as msg}
	<p>{msg}</p>
{/each}
