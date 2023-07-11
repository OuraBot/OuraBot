import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, PlatformEnum } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'id';
	description = 'Get the Twitch ID of a user or yourself';
	usage = 'id <user?>';
	userCooldown = 1;
	channelCooldown = 1;
	modifiablePermissions = true;
	category = CategoryEnum.Utility;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (args[0]) {
			const userResp = await ob.utils.resolveUserByUsername(ob.utils.sanitizeName(args[0]));
			if (!userResp)
				return {
					success: false,
					message: 'User not found',
				};

			return {
				success: true,
				message: `${await ob.utils.smartObfuscate(Channel, userResp.displayName, user)} => ${userResp.id}`,
			};
		} else {
			return {
				success: true,
				message: `${user} => ${msg.userInfo.userId}`,
			};
		}
	};
})();
