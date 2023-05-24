import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'ping';
	description = 'Ping the bot';
	usage = 'ping';
	userCooldown = 5;
	channelCooldown = 5;
	category = CategoryEnum.Utility;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		return {
			success: true,
			message: `Pong! Serving ${ob.channels.length} channels for ${ob.utils.humanizeTime(process.uptime() * 1000)}. ${ob.utils.stopNanoStopwatch(
				`interal_message_delay_${msg.id}`
			)}ms internal delay. Prefix: ${Channel.prefix} (https://status.mrauro.dev/)`,
		};
	};
})();
