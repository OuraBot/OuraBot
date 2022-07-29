import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, Permission } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'test';
	description = 'Test command';
	usage = 'test';
	userCooldown = 0;
	channelCooldown = 0;
	hidden = true;
	permissions = [Permission.Owner, Permission.Admin];
	category = CategoryEnum.Utility;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		return {
			success: true,
			message: `xd`,
		};
	};
})();
