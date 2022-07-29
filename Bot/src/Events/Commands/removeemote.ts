import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import axios from 'axios';
import OuraBot from '../../Client';
import { SevenTVEmote, SevenTVGQLMutationRemoveChannelEmote, SevenTVGQLQueryUser } from '../../Typings/API';
import { Command, CommandReturn, Channel, CategoryEnum, Permission } from '../../Typings/Twitch';
import { SevenTVGQLQueries, SevenTVGQLUrl } from '../../Utils/API/constants';
import { EnvironmentVariables } from '../../Utils/env';

export const cmd = new (class command implements Command {
	name = 'removeemote';
	description = 'Removes a 7TV emote from the channel (NOTE: Add Oura_Bot as a 7TV editor to use this command)';
	usage = 'removeemote <Emote>';
	userCooldown = 10;
	channelCooldown = 5;
	modifiablePermissions = true;
	permissions = [Permission.Broadcaster];
	category = CategoryEnum.Utility;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let userData = await ob.api.gql<SevenTVGQLQueryUser>(SevenTVGQLUrl, 10, SevenTVGQLQueries.getUser, { id: user });
		if (userData.error)
			return {
				success: false,
				message: `Error: ${userData.error.code}`,
			};

		if (!userData.data.response.data.data.user.editors.map((e) => e.twitch_id).includes(ob.config.twitch_id))
			return {
				success: false,
				message: 'I need to be a channel editor on 7TV to use this command',
			};

		if (!args[0])
			return {
				success: false,
				message: 'Missing 7TV emote',
			};

		const channelEmotes = await ob.utils.get7tvChannelEmotes(Channel.channel);

		let targetEmote = channelEmotes.find((e) => e.name === args[0]) || null;
		if (!targetEmote)
			return {
				success: false,
				message: `Invalid emote`,
			};

		let emoteData = await ob.api.gql<SevenTVGQLMutationRemoveChannelEmote>(
			SevenTVGQLUrl,
			1,
			SevenTVGQLQueries.removeEmote,
			{
				ch: userData.data.response.data.data.user.id,
				em: targetEmote.id,
				re: 'Emote removed by Oura_Bot',
			},
			{
				authorization: `Bearer ${EnvironmentVariables.SEVENTV_AUTH}`,
			}
		);

		if (emoteData.error)
			return {
				success: false,
				message: `Error while removing emote (${emoteData.error.code})`,
			};

		let emoteSlotsUsed = emoteData.data.response.data.data.removeChannelEmote.emotes.length;

		await ob.utils.invalidate7tvChannelEmotesCache(Channel.channel);

		return {
			success: true,
			message: `Removed emote ${targetEmote.name} (${emoteSlotsUsed}/${emoteData.data.response.data.data.removeChannelEmote.emote_slots} slots used)`,
		};
	};
})();
