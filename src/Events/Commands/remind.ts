import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'remind';
	description = 'Remind a user with a message for when they next type';
	usage = 'remind <user> <message>';
	userCooldown = 10;
	channelCooldown = 0;
	category = CategoryEnum.Fun;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (!args[0])
			return {
				success: false,
				message: 'Missing user',
			};

		if (!args[1])
			return {
				success: false,
				message: 'Missing message',
			};

		let targetUser = ob.utils.sanitizeName(args[0]).toLowerCase();

		if (targetUser == 'oura_bot')
			return {
				success: false,
				message: "You can't remind me FailFish",
			};

		if (!ob.utils.TwitchUsernameRegex.test(targetUser))
			return {
				success: false,
				message: 'Invalid user',
			};

		let reminderMessage = args.slice(1).join(' ');

		if (reminderMessage.length > 400)
			return {
				success: false,
				message: 'Message must be less than 400 characters',
			};

		let targetUserResp = await ob.utils.resolveUserByUsername(targetUser);

		let reminder = await ob.ReminderManager.createReminder(msg.userInfo.userId, targetUserResp.id, reminderMessage, user);

		return {
			success: true,
			message: `${targetUserResp.displayName} will be reminded when they next type (ID: ${reminder.id})`,
		};
	};
})();
