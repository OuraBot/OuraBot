import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'commands';
	description = "Links to the channel's commands";
	usage = 'commands';
	userCooldown = 15;
	channelCooldown = 10;
	category = CategoryEnum.Utility;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		return {
			success: true,
			message: `You can view the commands here: https://ourabot.com/commands/${Channel.channel}`,
		};
	};
})();
