import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, PlatformEnum } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import { IvrFiBot } from '../../Typings/API';

export const cmd = new (class command implements Command {
	name = 'bot';
	description = 'Check if a user has the verified bot status';
	usage = 'bot <user>';
	userCooldown = 10;
	channelCooldown = 5;
	modifiablePermissions = true;
	category = CategoryEnum.Utility;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (!args[0])
			return {
				success: false,
				message: 'Missing user',
			};

		if (!ob.utils.TwitchUsernameRegex.test(args[0]))
			return {
				success: false,
				message: 'Invalid user',
			};

		let targetUser = ob.utils.sanitizeName(args[0]);
		const botResp = await ob.api.get<IvrFiBot>(`https://api.ivr.fi/twitch/bot/${targetUser}`, 360);
		if (botResp.error)
			return {
				success: false,
				message: `Invalid user`,
			};

		return {
			success: true,
			message: `${await ob.utils.smartObfuscate(Channel, botResp.data.response.data.display_name, user)}: Verified Bot: ${
				botResp.data.response.data.verified
			} | Known Bot: ${botResp.data.response.data.known}`,
		};
	};
})();
