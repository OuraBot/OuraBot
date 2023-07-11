import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, PlatformEnum } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'whois';
	description = 'Get information about a specified user';
	usage = 'whois <user>';
	userCooldown = 10;
	channelCooldown = 5;
	modifiablePermissions = true;
	category = CategoryEnum.Utility;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (!args[0])
			return {
				success: false,
				message: 'Missing user',
			};

		if (!ob.utils.TwitchUsernameRegex.test(args[0]))
			return {
				success: false,
				message: 'Invalid user',
			};

		let userResp = await ob.utils.resolveUserByUsername(args[0]);
		if (!userResp)
			return {
				success: false,
				message: 'Invalid user',
			};

		let userRoles = [];
		if (userResp.roles.isAffiliate) userRoles.push('affiliate');
		if (userResp.roles.isPartner) userRoles.push('partner');
		if (userResp.roles.isStaff) userRoles.push('staff');
		if (userResp.roles.isSiteAdmin) userRoles.push('admin');
		if (userResp.bot) userRoles.push('bot');

		return {
			success: true,
			message: `user: ${await ob.utils.smartObfuscate(Channel, userResp.displayName, user)}, ${userResp.banned ? '⛔ BANNED | ' : ''} chat color: ${
				userResp.chatColor ?? 'none'
			} | account created: ${ob.utils.timeDelta(new Date(userResp.createdAt))} | roles: ${userRoles.length ? userRoles.join(', ') : 'none'} | id: ${userResp.id}`,
		};
	};
})();
