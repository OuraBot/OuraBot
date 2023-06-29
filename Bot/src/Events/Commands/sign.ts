import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, Permission, PlatformEnum } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import { sign } from 'jsonwebtoken';

export const cmd = new (class command implements Command {
	name = 'sign';
	description = 'sign';
	usage = 'sign';
	userCooldown = 5;
	channelCooldown = 5;
	permissions = [Permission.Owner];
	ownerOnly = true;
	hidden = true;
	category = CategoryEnum.Utility;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		const id = args[0];
		const secret = args[1] || 'secret';

		if (!id)
			return {
				success: false,
				message: 'missing id',
			};

		const token = sign({ id }, secret);

		return {
			success: true,
			message: 'ppHop',
		};
	};
})();
