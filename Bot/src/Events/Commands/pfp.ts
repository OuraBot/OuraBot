import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, PlatformEnum } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'pfp';
	description = 'Get the profile picture URL for a user';
	usage = 'pfp <user?>';
	aliases = ['7tvpfp'];
	userCooldown = 10;
	channelCooldown = 5;
	modifiablePermissions = true;
	category = CategoryEnum.Utility;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let targetUser = args[0] || user;

		if (!ob.utils.TwitchUsernameRegex.test(targetUser))
			return {
				success: false,
				message: 'Invalid user',
			};

		const userResp = await ob.utils.resolveUserByUsername(targetUser);
		const user7tvResp = await ob.utils.get7tvUserData(userResp.id);

		const sevenTvProfilePictureId = user7tvResp ? user7tvResp.profile_picture_id : null;

		return {
			success: true,
			message: `${targetUser == user ? 'Your' : (await ob.utils.smartObfuscate(Channel, userResp.displayName, user)) + "'s"} profile picture is ${userResp.logo} ${
				sevenTvProfilePictureId ? `Animated 7TV profile picture is https://cdn.7tv.app/pp/${user7tvResp.id}/${sevenTvProfilePictureId}` : ''
			}`,
		};
	};
})();
