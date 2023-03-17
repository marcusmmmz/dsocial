import Ably from "ably";
import SimplePeer from "simple-peer";
import type { PeerId } from "./interfaces";
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

export const ably = new Ably.Realtime("sA7Nqw.O15j_Q:kwempffC2VB5q_ObCL4ksMik3W36PLypgdKau2br7i8");

const peerConnectSubscribers: ((peerId: PeerId) => any)[] = [];

export let attemptingConnections = new Map<PeerId, SimplePeer.Instance>();

export let connections = new Map<PeerId, SimplePeer.Instance>();

export function createPeer(peerId: PeerId, initiator: boolean) {
	let peer = new SimplePeer({
		initiator,
		trickle: false,
		config: {
			iceServers
		}
	});

	attemptingConnections.set(peerId, peer);

	peer
		.on("connect", () => {
			console.log("connected", peerId);
			attemptingConnections.delete(peerId);
			connections.set(peerId, peer);
			connectedCountStore.increment();
			peerConnectSubscribers.forEach((fn) => fn(peerId));
		})
		.on("close", () => {
			console.log("disconnected: ", peerId);
			connections.delete(peerId);
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

export function onPeerConnect(callback: (peerId: PeerId) => any) {
	peerConnectSubscribers.push(callback);
}

export function broadcast(type: string, data: any) {
	for (const [_, conn] of connections) {
		conn.send(
			JSON.stringify({
				type,
				data
			})
		);
	}
}

export function unicast(peerId: PeerId, type: string, data: any) {
	const peer = connections.get(peerId);

	peer?.send(
		JSON.stringify({
			type,
			data
		})
	);
}
