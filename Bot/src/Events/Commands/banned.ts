import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'banned';
	description = 'Check if a user is banned';
	usage = 'banned <user>';
	aliases = ['banreason'];
	userCooldown = 10;
	channelCooldown = 5;
	category = CategoryEnum.Utility;
	modifiablePermissions = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (!args[0])
			return {
				success: false,
				message: 'Missing user',
			};

		let userResp = await ob.utils.resolveUserByUsername(args[0]);

		if (!userResp)
			return {
				success: false,
				message: `Invalid user`,
			};

		let banReason = await ob.utils.getBanReason(userResp.login);

		return {
			success: true,
			message: `${userResp.banned ? userResp.login : await ob.utils.smartObfuscate(Channel, userResp.login, user)} (${userResp.id}) => ${
				userResp.banned ? `⛔ BANNED (${banReason})` : 'Not banned'
			}`,
		};
	};
})();
