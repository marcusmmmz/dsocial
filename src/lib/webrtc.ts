import Ably from "ably";
import SimplePeer from "simple-peer";
import { connectedCountStore } from "./stores";

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

// change this to assymetric keys when security is needed
// as of now an attacker could stop people from connecting
export let myId = Math.random().toString(); //crypto.randomUUID();

export const ably = new Ably.Realtime("sA7Nqw.O15j_Q:kwempffC2VB5q_ObCL4ksMik3W36PLypgdKau2br7i8");

const peerConnectSubscribers: ((peerId: string) => any)[] = [];

export let connections: Record<string, SimplePeer.Instance> = {};

export function createPeer(peerId: string, initiator: boolean) {
	let peer = new SimplePeer({
		initiator,
		trickle: false,
		config: {
			iceServers
		}
	});

	peer
		.on("connect", () => {
			console.log("connected", peerId);
			connections[peerId] = peer;
			connectedCountStore.increment();
			peerConnectSubscribers.forEach((fn) => fn(peerId));
		})
		.on("close", () => {
			console.log("disconnected: ", peerId);
			delete connections[peerId];
			connectedCountStore.decrement();
		})
		.on("data", (data) => {
			console.log("data: " + data);
		})
		.on("error", (err) => {
			if (err.message.includes("User-Initiated Abort")) return;
			if (err.message.includes("Connection failed")) return;

			console.log(err);
		});

	return peer;
}

export function onPeerConnect(callback: (peerId: string) => any) {
	peerConnectSubscribers.push(callback);
}

export function broadcast(type: string, data: any) {
	Object.values(connections).forEach((peer) => {
		peer.send(
			JSON.stringify({
				type,
				data
			})
		);
	});
}

export function unicast(peerId: string, type: string, data: any) {
	const peer = connections[peerId];

	peer.send(
		JSON.stringify({
			type,
			data
		})
	);
}
