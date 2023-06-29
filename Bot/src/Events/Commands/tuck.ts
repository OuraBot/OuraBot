import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, PlatformEnum } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'tuck';
	description = 'Tuck a user into bed';
	usage = 'tuck <user>';
	userCooldown = 10;
	channelCooldown = 0;
	category = CategoryEnum.Fun;
	platforms = [PlatformEnum.Kick, PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let userToTuck = args[0] || 'themselves';
		let emote = args[1] || 'FeelsOkayMan';

		if (userToTuck.toLowerCase() === 'oura_bot')
			return {
				success: true,
				message: `Stare I am always awake...`,
			};

		return {
			success: true,
			message: `${user} tucks ${userToTuck} into bed ${ob.utils.formatMessage(emote, true)} 👉 🛏`,
			noping: true,
		};
	};
})();
