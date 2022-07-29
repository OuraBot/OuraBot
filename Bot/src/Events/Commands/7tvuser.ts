import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { SevenTVGQLQueryUser } from '../../Typings/API';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { SevenTVGQLQueries, SevenTVGQLUrl } from '../../Utils/API/constants';

export const cmd = new (class command implements Command {
	name = '7tvuser';
	description = 'Get the 7TV information for a user';
	usage = '7tvuser <user?>';
	userCooldown = 10;
	channelCooldown = 0;
	category = CategoryEnum.Utility;
	modifiablePermissions = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let targetUser = args[0] || user;

		if (!ob.utils.TwitchUsernameRegex.test(targetUser))
			return {
				success: false,
				message: 'Invalid user',
			};

		const userResp = await ob.utils.resolveUserByUsername(targetUser);
		if (!userResp) return { success: false, message: 'Invalid user' };

		let [user7tvData, user7tvRespGQL, user7tvEmotes] = await Promise.all([
			ob.utils.get7tvUserData(userResp.id),
			ob.api.gql<SevenTVGQLQueryUser>(SevenTVGQLUrl, 10, SevenTVGQLQueries.getUser, { id: userResp.id }),
			ob.utils.get7tvChannelEmotes(userResp.id),
		]);

		if (!user7tvData) {
			return {
				success: false,
				message: 'User not found',
			};
		}

		const sevenTvProfilePictureId = user7tvData ? user7tvData.profile_picture_id : null;

		return {
			success: true,
			message: `${targetUser == user ? 'Your' : (await ob.utils.smartObfuscate(Channel, userResp.displayName, user)) + "'s"} 7TV Information: ID: ${
				user7tvData.id
			} | editors: ${user7tvRespGQL.data.response.data.data.user.editors.length} | emotes: ${user7tvEmotes.length}/${
				user7tvRespGQL.data.response.data.data.user.emote_slots
			}${user7tvData.role.id !== '000000000000000000000000' ? ` | role: ${user7tvData.role.name}` : ''}${
				sevenTvProfilePictureId ? ` | animated profile picture: https://cdn.7tv.app/pp/${user7tvData.id}/${sevenTvProfilePictureId}` : ''
			}`,
		};
	};
})();
