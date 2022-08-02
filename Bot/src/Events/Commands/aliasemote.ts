import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, Permission } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import { SevenTVEmote, SevenTVGQLMutationAddChannelEmote, SevenTVGQLMutationEditChannelEmote, SevenTVGQLQueryUser } from '../../Typings/API';
import { SevenTVGQLQueries, SevenTVGQLUrl } from '../../Utils/API/constants';
import { EnvironmentVariables } from '../../Utils/env';

export const cmd = new (class command implements Command {
	name = 'aliasemote';
	description = 'Alias an enabled 7TV emote (NOTE: Add Oura_Bot as a 7TV editor to use this command)';
	usage = 'aliasemote <emote> <alias>';
	userCooldown = 10;
	channelCooldown = 5;
	category = CategoryEnum.Utility;
	// modifiablePermissions = true;
	permissions = [Permission.Owner];
	hidden = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (!args[0])
			return {
				success: false,
				message: 'Missing emote',
			};

		if (!args[1])
			return {
				success: false,
				message: 'Missing alias',
			};

		ob.utils.SevenTVEmoteRegex.lastIndex = 0;

		let emoteAlias = ob.utils.SevenTVEmoteRegex.exec(args[1]);
		if (!emoteAlias)
			return {
				success: false,
				message: 'Invalid alias',
			};

		let userData = await ob.api.gql<SevenTVGQLQueryUser>(SevenTVGQLUrl, 10, SevenTVGQLQueries.getUser, { id: user });
		if (userData.error)
			return {
				success: false,
				message: `Error: ${userData.error.code}`,
			};

		console.log(userData.data.response.data.data.user.editors);

		if (!userData.data.response.data.data.user.editors.map((e) => e.twitch_id).includes(ob.config.twitch_id))
			return {
				success: false,
				message: 'I need to be a channel editor on 7TV to use this command',
			};

		const channelEmotes = await ob.utils.get7tvChannelEmotes(Channel.channel);

		let targetEmote = channelEmotes.find((e) => e.name === args[0]) || null;
		if (!targetEmote)
			return {
				success: false,
				message: `Invalid emote`,
			};

		console.log(emoteAlias, typeof emoteAlias);

		let emoteData = await ob.api.gql<SevenTVGQLMutationEditChannelEmote>(
			SevenTVGQLUrl,
			1,
			SevenTVGQLQueries.editEmote,
			{
				ch: userData.data.response.data.data.user.id,
				em: targetEmote.id,
				data: {
					alias: emoteAlias[0],
				},
				re: 'Emote aliased by Oura_Bot',
			},
			{
				authorization: `Bearer ${EnvironmentVariables.SEVENTV_AUTH}`,
			}
		);

		if (emoteData.error) return { success: false, message: `Error while aliasing emote (${emoteData.error?.code})` };

		await ob.utils.invalidate7tvChannelEmotesCache(Channel.channel);

		return {
			success: true,
			message: `Successfully aliased emote ${targetEmote.name} to ${emoteAlias}`,
		};
	};
})();
