import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import chalk from 'chalk';
import OuraBot from '../../Client';
import { Module, CommandReturn, Channel } from '../../Typings/Twitch';
import { Modules } from '../../../../Common/src';

export const _module = new (class module implements Module {
	name = 'links';
	description = 'Times out users who send links';
	hidden = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, message: string, msg: TwitchPrivateMessage, data: Modules['links']): Promise<void> => {
		if (msg.userInfo.isMod == true || msg.userInfo.isBroadcaster == true) return; // Cant timeout mods or broadcaster

		if (data.chatMode !== 'both') {
			const isOnline = await ob.CacheManager.cache(
				async () => {
					const streamInfo = await ob.twitch.apiClient.streams.getStreamByUserId(Channel.id);
					return streamInfo ? true : false;
				},
				`${msg.channelId}_isOnline`,
				60
			);

			if (data.chatMode == 'online' && !isOnline) return;
			if (data.chatMode == 'offline' && isOnline) return;
		}

		let parts = message.split(/\s/);
		let urls: string[] = [];

		const re = new RegExp(
			'^(https?:\\/\\/)?' +
				'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
				'((\\d{1,3}\\.){3}\\d{1,3}))' +
				'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
				'(\\?[;&a-z\\d%_.~+=-]*)?' +
				'(\\#[-a-z\\d_]*)?$',
			'i'
		);

		await ob.twitch.apiClient.asUser(ob.config.twitch_id, async (ctx) => {
			for (let part of parts) {
				try {
					if (re.test(part)) {
						if (data.timeout == 0) {
							ctx.moderation.deleteChatMessages(Channel.id, msg.id).catch((err) => {
								ob.logger.warn(`Failed deleting message in ${Channel.channel}: ${err}`, 'ob.events.modules.smartemoteonly');
							});
						} else {
							ctx.moderation
								.banUser(Channel.id, {
									reason: 'Links are not allowed',
									duration: data.timeout,
									user: msg.userInfo.userId,
								})
								.catch((err) => {
									ob.logger.warn(`Failed banning user in ${Channel.channel}: ${err}`, 'ob.events.modules.smartemoteonly');
								});
						}
						break;
					}
				} catch (e) {
					console.log(e);
					continue;
				}
			}
		});
	};
})();
