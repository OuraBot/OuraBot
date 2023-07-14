import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import chalk from 'chalk';
import OuraBot from '../../Client';
import { Module, CommandReturn, Channel } from '../../Typings/Twitch';
import { ModuleKey } from '../../../../Common/src';
import { Emote } from '../../Typings/ThirdPartyEmotes';

export const _module = new (class module implements Module {
	name = 'smartemoteonly';
	description = 'Deletes messages that are not Twitch emotes or 3rd party emotes';
	requiresMod = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, message: string, msg: TwitchPrivateMessage, data: ModuleKey['smartemoteonly']): Promise<void> => {
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

		const otherEmotes: Emote[] = await ob.CacheManager.cache(
			async () => {
				return await ob.utils.getAllEmotes(Channel);
			},
			`smartEmoteOnly_${Channel.channel}`,
			60
		);

		emotes.push(...(await otherEmotes).map((e: Emote) => e.name));

		const splitMessage = message.split(' ');

		for (let word of splitMessage) {
			if (!emotes.includes(word)) {
				if (data.timeout == 0) {
					ob.twitch.apiClient.moderation.deleteChatMessages(Channel.id, msg.id).catch((err) => {
						ob.logger.warn(`Failed deleting message in ${Channel.channel}: ${err}`, 'ob.events.modules.smartemoteonly');
					});
				} else {
					ob.twitch.apiClient.moderation
						.banUser(Channel.id, {
							reason: 'Smart emote only module is enabled (only Twitch or 3rd party emotes are allowed)',
							duration: data.timeout,
							user: msg.userInfo.userId,
						})
						.catch((err) => {
							ob.logger.warn(`Failed banning user in ${Channel.channel}: ${err}`, 'ob.events.modules.smartemoteonly');
						});
				}
				return;
			}
		}
	};
})();
