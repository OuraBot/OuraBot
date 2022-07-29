import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'randomtimeout';
	description = 'Timeout yourself for a random amount of time.';
	usage = 'randomtimeout';
	userCooldown = 5;
	channelCooldown = 0;
	modifiablePermissions = true;
	category = CategoryEnum.Fun;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		// TODO: Make below min/max values configurable
		const max = 60 * 60 * 24 * 7; // 7 days
		const min = 1; // 1 second

		let seconds = Math.floor(Math.random() * (max - min) + min);

		if (msg.userInfo.isBroadcaster || msg.userInfo.isMod) {
			return {
				success: false,
				message: 'I cannot time you out!',
			};
		}

		ob.twitch.say(Channel, `/timeout ${user} ${seconds} Random timeout command usage`);
		return {
			success: true,
			noping: true,
			message: `${await ob.utils.getBestAvailableEmote(Channel, ['MODS', 'RIPBOZO'], 'BOP')} ${user} has been timed out for ${ob.utils.humanizeTime(
				seconds * 1000
			)}`,
		};
	};
})();
