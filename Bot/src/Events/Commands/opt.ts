import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'opt';
	description = 'Opt in or out of certain features';
	usage = 'opt <in|out> <logs>';
	userCooldown = 10;
	channelCooldown = 0;
	category = CategoryEnum.Utility;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (!args[0])
			return {
				success: false,
				message: 'Missing in/out option',
			};

		if (!args[1])
			return {
				success: false,
				message: 'Missing feature to opt in/out of',
			};

		if (args[0] === 'in') {
			switch (args[1]) {
				case 'logs':
					await ob.sqlite.updateUser(msg.userInfo.userId, false);
					return {
						success: true,
						message: 'Your message logs will now be able to be displayed in other commands',
					};
					break;

				default:
					return {
						success: false,
						message: 'Invalid feature to opt in to',
					};
			}
		} else if (args[0] === 'out') {
			switch (args[1]) {
				case 'logs':
					await ob.sqlite.updateUser(msg.userInfo.userId, true);
					return {
						success: true,
						message: `Your message logs will no longer be able to be displayed in other commands`,
					};
					break;

				default:
					return {
						success: false,
						message: 'Invalid feature to opt in to',
					};
			}
		} else {
			return {
				success: false,
				message: 'Invalid in/out option',
			};
		}
	};
})();
