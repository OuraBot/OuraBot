import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, Permission } from '../../Typings/Twitch';
import { SevenTVEvents } from '../../Utils/SevenTVEvents';

export const cmd = new (class command implements Command {
	name = 'pyramid';
	description = 'Create a pyramid with a given width and message';
	usage = 'pyramid <width> <message>';
	userCooldown = 10;
	channelCooldown = 10;
	permission = 1;
	modifiablePermissions = true;
	permissions = [Permission.Broadcaster, Permission.Moderator];
	category = CategoryEnum.Fun;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let width = parseInt(args[0]);
		if (isNaN(width))
			return {
				success: false,
				message: `Invalid width (${Channel.prefix}pyramid <width> <message>)`,
				reducedCooldown: 3,
			};

		if (width < 1)
			return {
				success: false,
				message: `Invalid width (${Channel.prefix}pyramid <width> <message>)`,
				reducedCooldown: 3,
			};

		let message = args.slice(1).join(' ');
		if (!message)
			return {
				success: false,
				message: `Missing message (${Channel.prefix}spam <count> <message>)`,
				reducedCooldown: 3,
			};

		if (message.length * width + width > 499)
			return {
				success: false,
				message: 'Message is too long for the given width',
				reducedCooldown: 3,
			};

		message = message + ' ';

		let messages = [];

		// first half
		for (let i = 0; i < width; i++) {
			messages.push(message.repeat(i + 1));
		}

		// second half
		for (let i = width; i > 0; i--) {
			if (i != width) messages.push(message.repeat(i));
		}

		ob.twitch.say(Channel, messages, 0.05, 'pyramid');

		return {
			success: true,
			message: null,
		};
	};
})();
