import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { Command, CommandReturn, Channel, CategoryEnum, Permission, PlatformEnum } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'stop';
	description = 'Stop any filesays, masspings, pyramids, or spams that are currently running';
	usage = 'stop';
	userCooldown = 5;
	channelCooldown = 5;
	permissions = [Permission.Broadcaster, Permission.Moderator];
	category = CategoryEnum.Utility;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (ob.cancels.has(Channel.channel))
			return {
				success: false,
				message: `There is already a stop for this channel in the list`,
			};

		ob.cancels.add(Channel.channel);

		setTimeout(() => {
			ob.cancels.delete(Channel.channel);
		}, 5000);

		return {
			success: true,
			message: null,
		};
	};
})();
