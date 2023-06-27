import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { SevenTVGQLQueryUser } from '../../Typings/API';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { SevenTVGQLQueries, SevenTVGQLUrl } from '../../Utils/API/constants';

export const cmd = new (class command implements Command {
	name = 'kickuser';
	description = 'Get the Kick information for a user';
	usage = 'kickuser <user?>';
	userCooldown = 10;
	channelCooldown = 0;
	category = CategoryEnum.Utility;
	modifiablePermissions = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let targetUser = args[0] || user;

		// Kick username regex may be different
		if (!ob.utils.TwitchUsernameRegex.test(targetUser))
			return {
				success: false,
				message: 'Invalid user',
			};

		const userResp = await ob.kick.fetchChannel(targetUser);
		if (!userResp) return { success: false, message: 'Invalid user' };

		return {
			success: true,
			message: `🟢 ${userResp.user.username} (user id: ${userResp.user_id})`,
		};
	};
})();
