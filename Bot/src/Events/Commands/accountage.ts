import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, PlatformEnum } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'accountage';
	description = 'Get the account age of a user';
	usage = 'accountage <user?>';
	userCooldown = 10;
	channelCooldown = 0;
	category = CategoryEnum.Utility;
	modifiablePermissions = true;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let targetUser = args[0] || user;

		if (!ob.utils.TwitchUsernameRegex.test(targetUser))
			return {
				success: false,
				message: 'Invalid user',
			};

		const userResp = await ob.utils.resolveUserByUsername(targetUser);

		return {
			success: true,
			message: `${targetUser == user ? 'You' : await ob.utils.smartObfuscate(Channel, userResp.displayName, user)} created ${
				targetUser == user ? 'your' : 'their'
			} account ${ob.utils.timeDelta(new Date(userResp.createdAt), 'auto')}`,
		};
	};
})();
