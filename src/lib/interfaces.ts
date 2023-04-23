export type Pubkey = string;

export interface IMessage {
	id: string;
	chatId: string;
	author: Pubkey;
	content: string;
}
