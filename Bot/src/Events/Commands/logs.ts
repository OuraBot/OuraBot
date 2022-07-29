import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'logs';
	description = 'Get the logs of a user (channel must be logged on https://logs.ivr.fi)';
	usage = 'logs <user?> <channel?>';
	userCooldown = 5;
	channelCooldown = 1;
	permission = 1;
	modifiablePermissions = true;
	category = CategoryEnum.Utility;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let targetUser = ob.utils.sanitizeName(args[0] || user);
		let targetChannel = ob.utils.sanitizeName(args[1] || Channel.channel);

		const isLogged = await ob.utils.isIvrFiLoggedChannel(targetChannel);
		if (!isLogged)
			return {
				success: false,
				message: `#${await ob.utils.smartObfuscate(Channel, targetChannel, user)} is not logged on https://logs.ivr.fi/`,
			};

		return {
			success: true,
			message: `Logs for ${await ob.utils.smartObfuscate(Channel, targetUser, user)} in #${await ob.utils.smartObfuscate(
				Channel,
				targetChannel,
				user
			)}: https://logs.ivr.fi/?channel=${targetChannel}&username=${targetUser}`,
		};
	};
})();
