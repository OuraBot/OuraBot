import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, Permission, PlatformEnum } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'say';
	description = 'Say something in any chat';
	usage = 'say <#channel?> <message>';
	userCooldown = 0;
	channelCooldown = 0;
	permissions = [Permission.Owner, Permission.Admin];
	hidden = true;
	category = CategoryEnum.Utility;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (!args[0])
			return {
				success: false,
				message: 'Missing message',
			};

		let channel = Channel.channel;
		if (args[0].startsWith('#')) channel = args[0];

		ob.twitch.say(channel, args.slice(1).join(' '));

		return {
			success: true,
			message: null,
		};
	};
})();
