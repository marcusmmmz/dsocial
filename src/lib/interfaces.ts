export type Pubkey = string;

export interface IMessage {
	id: string;
	chatId: string;
	author: Pubkey;
	content: string;
	createdAt: number;
}

export interface IProfile {
	username: string;
	picture?: string;
}
