import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, Permission, PlatformEnum } from '../../Typings/Twitch';
import ms from 'ms';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import { HelixChannelFollower, HelixFollow } from '@twurple/api/lib';

const dryrunRegex = /--(dont|dry)-?(ban|run)/gi;

export const cmd = new (class command implements Command {
	name = 'follownuke';
	description = 'Ban users who have folowed in the last X time (useful against followbots)';
	usage = 'follownuke <time (30s, 5m, 1h)> <--dont-ban?>';
	userCooldown = 10;
	channelCooldown = 5;
	permissions = [Permission.Broadcaster, Permission.Moderator];
	category = CategoryEnum.Moderation;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (!args[0])
			return {
				success: false,
				message: 'Missing time (30s, 5m, 1h, etc)',
			};

		const dryrun = args[1]?.match(dryrunRegex);
		const timeToCallback = Math.abs(ms(args[0]));

		// Check if NaN before fetching users since NaN bypasses all if statements
		// massban incident of 3/11/22 Aware
		if (isNaN(timeToCallback))
			return {
				success: false,
				message: 'Invalid time (30s, 5m, 1h, etc)',
			};

		if (timeToCallback > 1000 * 60 * 60 * 24 * 3)
			return {
				success: false,
				message: 'Callback time must be less than 3 days',
			};

		const callbackTime = Date.now() - timeToCallback;

		let followers: HelixChannelFollower[] = [];

		let followsResp = ob.twitch.apiClient.channels.getChannelFollowersPaginated(Channel.id);
		for await (const follower of followsResp) {
			let followTime = new Date(follower.followDate).getTime();
			if (callbackTime > followTime) {
				break;
			} else {
				followers.push(follower);
			}
		}

		if (followers.length == 0)
			return {
				success: false,
				message: 'No users found in that time',
			};

		const userListHaste = await ob.utils.upload(followers.map((follower) => follower.userName).join('\n'));

		if (dryrun) {
			return {
				success: true,
				message: `Caught ${followers.length} users: ${userListHaste}`,
			};
		} else {
			ob.twitch.say(Channel, `Banning ${followers.length} users: ${userListHaste}`);

			for (const follower of followers) {
				await ob.twitch.apiClient.moderation.banUser(Channel.id, { user: follower.userId, reason: `Follownuke by ${user}` });
			}

			return {
				success: true,
				message: `Banned ${followers.length} users: ${userListHaste}`,
			};
		}
	};
})();
