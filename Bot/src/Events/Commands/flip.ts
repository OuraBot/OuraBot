import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'flip';
	description = 'Flip a coin';
	usage = 'flip';
	userCooldown = 5;
	channelCooldown = 1;
	category = CategoryEnum.Utility;
	modifiablePermissions = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		return {
			success: true,
			message: Math.random() > 0.5 ? 'Heads!' : 'Tails!',
		};
	};
})();
