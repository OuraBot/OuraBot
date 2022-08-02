import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import axios from 'axios';
import OuraBot from '../../Client';
import { SevenTVEmote, SevenTVGQLMutationAddChannelEmote, SevenTVGQLQueryUser } from '../../Typings/API';
import { Command, CommandReturn, Channel, CategoryEnum, Permission } from '../../Typings/Twitch';
import { SevenTVGQLQueries, SevenTVGQLUrl } from '../../Utils/API/constants';
import { EnvironmentVariables } from '../../Utils/env';

export const cmd = new (class command implements Command {
	name = 'addemote';
	description = 'Add a 7TV emote to the channel (NOTE: Add Oura_Bot as a 7TV editor to use this command)';
	usage = 'addemote <Emote URL>';
	userCooldown = 10;
	channelCooldown = 5;
	category = CategoryEnum.Utility;
	// modifiablePermissions = true;
	permissions = [Permission.Owner];
	hidden = true;
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
				message: 'Missing 7TV emote URL/ID',
			};

		// we must set the lastIndex to 0 to prevent the regex from matching the same emote again because javascript is stupid :/
		ob.utils.SevenTVEmoteURLRegex.lastIndex = 0;

		let _emoteId = ob.utils.SevenTVEmoteURLRegex.exec(args[0]);
		let emoteId = _emoteId.at(-1);

		if (!emoteId)
			return {
				success: false,
				message: 'Invalid 7TV emote URL/ID',
			};

		let emoteData = await ob.api.gql<SevenTVGQLMutationAddChannelEmote>(
			SevenTVGQLUrl,
			1,
			SevenTVGQLQueries.addEmote,
			{
				ch: userData.data.response.data.data.user.id,
				em: emoteId,
				re: 'Emote added by Oura_Bot',
			},
			{
				authorization: `Bearer ${EnvironmentVariables.SEVENTV_AUTH}`,
			}
		);

		if (emoteData.error) return { success: false, message: `Error while adding emote (${emoteData.error?.code})` };

		let newEmoteData = await ob.api.get<SevenTVEmote>(`https://api.7tv.app/v2/emotes/${emoteId}`, 10);
		if (newEmoteData.error) newEmoteData.data.response.data.name = '<Error while fetching emote name>';

		let emoteSlotsUsed = emoteData.data.response.data.data.addChannelEmote.emotes.length;

		await ob.utils.invalidate7tvChannelEmotesCache(Channel.channel);

		return {
			success: true,
			message: `Successfully added emote ${newEmoteData.data.response.data.name} (${emoteSlotsUsed}/${emoteData.data.response.data.data.addChannelEmote.emote_slots} slots used)`,
		};
	};
})();
