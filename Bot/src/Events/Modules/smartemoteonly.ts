import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import chalk from 'chalk';
import OuraBot from '../../Client';
import { Module, CommandReturn, Channel } from '../../Typings/Twitch';

export const _module = new (class module implements Module {
	name = 'smartemoteonly';
	description = 'Deletes messages that are not Twitch emotes or 3rd party emotes';
	requiresMod = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, message: string, msg: TwitchPrivateMessage): Promise<void> => {
		if (msg.userInfo.isMod == true || msg.userInfo.isBroadcaster == true || msg.userInfo.isVip) return;

		let isCheerMessage = false;

		const emotes: string[] = [];
		for (let part of msg.parseEmotes()) {
			if (part.type == 'emote') {
				emotes.push(part.name);
			} else if (part.type == 'cheer') {
				isCheerMessage = true;
			}
		}

		if (isCheerMessage) return;

		emotes.push(...(await ob.utils.getAllEmotes(Channel)).map((e) => e.name));

		const splitMessage = message.split(' ');

		for (let word of splitMessage) {
			if (!emotes.includes(word)) {
				ob.twitch.say(Channel, `/delete ${msg.id}`);
				return;
			}
		}
	};
})();
