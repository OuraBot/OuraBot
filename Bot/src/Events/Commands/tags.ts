import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, PlatformEnum } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'tags';
	description = 'Uploads the raw IRC tags from a message to a file';
	usage = 'tags';
	userCooldown = 10;
	channelCooldown = 1;
	modifiablePermissions = true;
	category = CategoryEnum.Utility;
	platforms = [PlatformEnum.Twitch];
	// prettier-ignore
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let url = await ob.utils.upload(msg.rawLine);

		return {
			success: true,
			message: `${url}`,
		};
	};
})();
