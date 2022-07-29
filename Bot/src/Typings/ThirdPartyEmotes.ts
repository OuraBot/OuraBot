export type EmoteProviders = '7TV' | 'FFZ' | 'BTTV';

export interface Emote {
	provider: EmoteProviders;
	id: string;
	name: string;
}

// from https://github.com/SevenTV/ServerGo/blob/f8c12e1a918e16cb4df652c1cb3343f66c3b555f/src/validation/validation.go#L10
export const SevenTVEmoteRegex = /^[-_A-Za-z():0-9]{2,100}$/;
