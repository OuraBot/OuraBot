import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import chalk from 'chalk';
import OuraBot from '../../Client';
import { Module, CommandReturn, Channel } from '../../Typings/Twitch';
import { Emote } from '../../Typings/ThirdPartyEmotes';
import { Modules } from '../../../../Common/src';
import { parseChatMessage } from '@twurple/chat';

export const _module = new (class module implements Module {
	name = 'smartemoteonly';
	description = 'Deletes messages that are not Twitch emotes or 3rd party emotes';
	requiresMod = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, message: string, msg: TwitchPrivateMessage, data: Modules['smartemoteonly']): Promise<void> => {
		if (msg.userInfo.isMod == true || msg.userInfo.isBroadcaster == true || msg.userInfo.isVip) return; // Mimicing native twitch functionality

		let isCheerMessage = false;

		const emotes: string[] = [];
		const parts = parseChatMessage(message, msg.emoteOffsets);
		for (let part of parts) {
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

		await ob.twitch.apiClient.asUser(ob.config.twitch_id, async (ctx) => {
			for (let word of splitMessage) {
				if (!emotes.includes(word)) {
					if (data.timeout == 0) {
						ctx.moderation.deleteChatMessages(Channel.id, msg.id).catch((err) => {
							ob.logger.warn(`Failed deleting message in ${Channel.channel}: ${err}`, 'ob.events.modules.smartemoteonly');
						});
					} else {
						ctx.moderation
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
		});
	};
})();
