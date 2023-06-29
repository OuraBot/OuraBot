import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, Permission, PlatformEnum } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'allemotes';
	description = 'Get all 3rd party emotes (spammy!)';
	usage = 'allemotes';
	userCooldown = 30;
	channelCooldown = 30;
	permissions = [Permission.Broadcaster];
	category = CategoryEnum.Fun;
	modifiablePermissions = true;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let emotes = await ob.utils.getAllEmotes(Channel);
		let chunkedArrays = ob.utils.chunkArr(
			emotes.map((emote) => emote.name),
			450
		);

		for (let chunkedArray of chunkedArrays) {
			ob.twitch.say(Channel, `@${user}, ` + chunkedArray);
		}

		return {
			success: true,
			message: null,
		};
	};
})();
