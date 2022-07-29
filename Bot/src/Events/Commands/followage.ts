import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'followage';
	description = 'Check how long a user has been following a channel';
	usage = 'followage <user?> <channel?>';
	aliases = ['fa'];
	userCooldown = 10;
	channelCooldown = 0;
	category = CategoryEnum.Fun;
	modifiablePermissions = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let targetUser = args[0] || user;
		let targetChannel = args[1] || Channel.channel;

		targetUser = ob.utils.sanitizeName(targetUser).toLowerCase();
		targetChannel = ob.utils.sanitizeName(targetChannel).toLowerCase();

		if (!ob.utils.TwitchUsernameRegex.test(targetUser))
			return {
				success: false,
				message: 'Invalid user',
			};

		if (!ob.utils.TwitchUsernameRegex.test(targetChannel))
			return {
				success: false,
				message: 'Invalid channel',
			};

		let subageData = await ob.utils.getSubage(targetUser, targetChannel);

		if (!subageData)
			return {
				success: true,
				message: `${await ob.utils.smartObfuscate(Channel, targetUser, user)} is not following ${await ob.utils.smartObfuscate(Channel, targetChannel, user)}`,
			};

		return {
			success: true,
			message: `${await ob.utils.smartObfuscate(Channel, targetUser, user)} has been following ${await ob.utils.smartObfuscate(
				Channel,
				targetChannel,
				user
			)} for ${ob.utils.timeDelta(new Date(subageData.followedAt), 'auto', true)}`,
		};
	};
})();
