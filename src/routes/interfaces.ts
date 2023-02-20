export type PeerId = string;

export interface IMessage {
	author: PeerId;
	content: string;
}
