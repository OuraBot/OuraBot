import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { Emote } from '../../Typings/ThirdPartyEmotes';
import { Channel, Module } from '../../Typings/Twitch';

export const _module = new (class module implements Module {
	name = 'messageheight';
	description = 'Timeout a user if their message is too tall';
	requiresMod: true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, message: string, msg: TwitchPrivateMessage): Promise<void> => {
		// We use an aggressive cache here since calculating the message height is slow
		// The badges are not as important so we can ignore them
		// Since we only store the cache for 6 hours, we don't really need to use the
		// emote size in the cache key
		const messageHeight = await ob.CacheManager.cache(
			async () => {
				let [channel7tvEmotes, channelFfzEmotes, channelBttvEmotes] = await Promise.all([
					ob.utils.get7tvChannelEmotes(Channel.channel),
					ob.utils.getFfzChannelEmotes(Channel.channel),
					ob.utils.getBttvChannelEmotes(Channel.channel),
				]);

				let channelEmotes: Emote[] = [];

				channel7tvEmotes.map((Emote) => {
					channelEmotes.push(Emote);
				});
				channelFfzEmotes.map((Emote) => {
					channelEmotes.push(Emote);
				});
				channelBttvEmotes.map((Emote) => {
					channelEmotes.push(Emote);
				});

				const parsedMessagePart = msg.parseEmotes();

				return await ob.MessageHeight.calculateMessageHeight(message, user, msg.userInfo.badges.size, parsedMessagePart, channelEmotes);
			},
			`messageHeight_${Channel.channel}-${message}-${user}`,
			60 * 60 * 6
		);
		ob.logger.debug(messageHeight, 'ob.twitch.events.message.modules.messageheight');

		// TODO: handle messageHeight number based on channel configured setting
	};
})();
