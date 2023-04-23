export type pubkey = string;

export interface IMessage {
	id: string;
	chatId: string;
	author: pubkey;
	content: string;
}
