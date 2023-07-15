import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, PlatformEnum } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'fromid';
	description = 'fromid';
	usage = 'fromid';
	userCooldown = 10;
	channelCooldown = 5;
	modifiablePermissions = true;
	category = CategoryEnum.Utility;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (!args[0])
			return {
				success: false,
				message: 'Missing user ID',
			};

		if (!args[0].match(/^[0-9]+$/))
			return {
				success: false,
				message: 'Invalid user ID',
			};

		let userID = args[0];

		let userResp;
		try {
			userResp = await ob.twitch.apiClient.users.getUserById(userID);
		} catch (err) {
			return {
				success: false,
				message: `User not found`,
			};
		}

		if (!userResp)
			return {
				success: false,
				message: `User not found`,
			};

		return {
			success: true,
			message: `${userID} => ${await ob.utils.smartObfuscate(Channel, userResp.name, user)}`,
		};
	};
})();
