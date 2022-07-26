import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { Emote } from '../../Typings/ThirdPartyEmotes';
import { Channel, Module } from '../../Typings/Twitch';

export const module = new (class module implements Module {
	name = 'messageheight';
	description = 'Timeout a user if their message is too tall';
	requiresMod: true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, message: string, msg: TwitchPrivateMessage): Promise<void> => {
		let [userResp, channel7tvEmotes, channelFfzEmotes, channelBttvEmotes] = await Promise.all([
			ob.utils.resolveUserByUsername(user),
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
		const messageHeight = await ob.MessageHeight.calculateMessageHeight(message, user, userResp.badge.length, parsedMessagePart, channelEmotes);
		console.log(messageHeight);

		// TODO: handle messageHeight number based on channel configured setting
	};
})();
