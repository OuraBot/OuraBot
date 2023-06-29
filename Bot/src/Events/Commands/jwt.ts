import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, Permission, PlatformEnum } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import { verify } from 'jsonwebtoken';

export const cmd = new (class command implements Command {
	name = 'jwt';
	description = 'jwt';
	usage = 'jwt';
	userCooldown = 0;
	channelCooldown = 0;
	hidden = true;
	permissions = [Permission.Owner];
	ownerOnly = true;
	category = CategoryEnum.Utility;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		const token = args[0];

		if (!token)
			return {
				success: false,
				message: 'missing token',
			};

		const secret = args[1] || 's3cr3t';

		const decoded = verify(token, secret);

		return {
			success: true,
			message: 'ppHop',
		};
	};
})();
