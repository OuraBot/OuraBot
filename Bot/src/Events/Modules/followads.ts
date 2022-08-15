import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import chalk from 'chalk';
import OuraBot from '../../Client';
import { Module, CommandReturn, Channel } from '../../Typings/Twitch';

export const _module = new (class module implements Module {
	name = 'followads';
	description = 'Detects follow advertisements and logs them (does not ban)';
	hidden = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, message: string, msg: TwitchPrivateMessage): Promise<void> => {
		if (msg.tags.get('first-msg') == '1') {
			let sanitizedMessage = ob.utils.removeBypassCharacters(ob.utils.removeAccents(message.toLowerCase()));

			if (sanitizedMessage.includes('buy followers') || sanitizedMessage.includes('buy primes') || sanitizedMessage.includes('buy viewers')) {
				// TODO
				// new ob.db.models.SuspiciousUser.model({
				// 	login: user,
				// 	id: msg.userInfo.userId,
				// 	message: message,
				// 	reason: 'Follows ad',
				// 	spottedAt: new Date(),
				// 	spottedIn: Channel.channel,
				// }).save();
			} else {
				let urls = ob.utils.urlsFromString(message);
				if (urls.length > 0) {
					let url = urls[0];

					let unshortendUrl = await ob.utils.unshortenURL(url);
					if (unshortendUrl.includes('bigfollows')) {
						// TODO
						// new ob.db.models.SuspiciousUser.model({
						// 	login: user,
						// 	id: msg.userInfo.userId,
						// 	message: message,
						// 	reason: 'Follows ad',
						// 	spottedAt: new Date(),
						// 	spottedIn: Channel.channel,
						// }).save();
					}
				}
			}
		}
	};
})();
