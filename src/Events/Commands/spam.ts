import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { Command, CommandReturn, Channel, CategoryEnum, Permission } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'spam';
	description = 'Spam a message';
	usage = 'spam <count> <message>';
	userCooldown = 10;
	channelCooldown = 10;
	permissions = [Permission.Broadcaster];
	modifiablePermissions = true;
	requiresFastLimits = true;
	category = CategoryEnum.Fun;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let count = parseInt(args[0]);
		if (isNaN(count))
			return {
				success: false,
				message: `Invalid count (${Channel.prefix}spam <count> <message>)`,
			};

		if (count < 1)
			return {
				success: false,
				message: `Invalid count (${Channel.prefix}spam <count> <message>)`,
			};

		if (count > 100)
			return {
				success: false,
				message: 'Spam count cannot be greater than 100',
			};

		let message = args.slice(1).join(' ');
		if (!message)
			return {
				success: false,
				message: `Missing message (${Channel.prefix}spam <count> <message>)`,
			};

		const messages = new Array(count).fill(message);

		ob.twitch.say(Channel, messages, 0.05, 'spam');

		return {
			success: true,
			message: null,
		};
	};
})();
