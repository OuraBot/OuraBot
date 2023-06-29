import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, PlatformEnum } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'rafk';
	description = 'Resume your AFK status (max 5 minutes ago)';
	usage = 'rafk';
	userCooldown = 30;
	channelCooldown = 0;
	category = CategoryEnum.Fun;
	platforms = [PlatformEnum.Kick, PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let userAfk = await ob.AfkManager.getAfks(msg.userInfo.userId);
		if (!userAfk || !userAfk.length)
			return {
				success: false,
				message: `You cannot resume your AFK status because it ended more than 5 minutes ago`,
			};

		userAfk
			.filter((afk) => afk.pending)
			.forEach((afk) => {
				afk.unpendDeletion();
			});

		return {
			success: true,
			message: 'Your AFK status has been resumed',
		};
	};
})();
