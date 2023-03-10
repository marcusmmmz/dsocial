import Ably from "ably";
import { connections, createPeer, myId } from "./webrtc";

export const ably = new Ably.Realtime("sA7Nqw.O15j_Q:kwempffC2VB5q_ObCL4ksMik3W36PLypgdKau2br7i8");

let signalingChannel = ably.channels.get("auto-connect");

const myChannel = ably.channels.get(myId);

export function publishYourself() {
	// 1
	signalingChannel.publish("online", myId);

	myChannel.unsubscribe();

	myChannel.subscribe("offer", (msg) => {
		// 2

		let otherPeerId: string = msg.data.id;

		if (getConns().find((id) => id == otherPeerId)) return;

		let peer = createPeer(otherPeerId, false);

		peer.signal(msg.data.offer);

		peer.on("signal", (data) => {
			let otherPeerChannel = ably.channels.get(otherPeerId);

			// 3
			otherPeerChannel.publish("answer", {
				id: myId,
				answer: data
			});
		});
	});
}

export function searchPublishers() {
	signalingChannel.subscribe("online", (msg) => {
		// 1
		const otherPeerId: string = msg.data;

		if (otherPeerId == myId) return;

		if (getConns().find((id) => id == otherPeerId)) return;

		const peerChannel = ably.channels.get(msg.data);

		const peer = createPeer(otherPeerId, true);

		peer.on("signal", (data) => {
			// 2
			peerChannel.publish("offer", {
				id: myId,
				offer: data
			});

			myChannel.subscribe("answer", (msg) => {
				// 3
				if (msg.data.id != otherPeerId) return;

				peer.signal(msg.data.answer);
			});
		});
	});
}

export function setSignalingChannel(name: string) {
	if (name == signalingChannel.name) return;

	signalingChannel.unsubscribe();
	signalingChannel = ably.channels.get(name);
}

function getConns() {
	return Object.keys(connections);
}
