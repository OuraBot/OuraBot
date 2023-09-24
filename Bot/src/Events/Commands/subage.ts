import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, PlatformEnum } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'subage';
	description = 'Check how long a user has been subscribed to a channel';
	usage = 'subage <user?> <channel?>';
	aliases = ['sa'];
	userCooldown = 10;
	channelCooldown = 0;
	modifiablePermissions = true;
	category = CategoryEnum.Fun;
	platforms = [PlatformEnum.Twitch];
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
				message: `${await ob.utils.smartObfuscate(Channel, targetUser, user)} is not subscribed to ${await ob.utils.smartObfuscate(
					Channel,
					targetChannel,
					user
				)}`,
			};

		// the following code was copied from v2's subage command
		// rewriting it would be a pain so im just gonna let this spaghetti code live

		// the util functions have been migrated to the newer ones though

		if (subageData.meta !== null) {
			let tier = subageData.meta.tier;
			let dnr = subageData.meta.renewsAt ? true : false;
			let endsAt = subageData.meta?.endsAt ? 'in ' + ob.utils.timeDelta(new Date(subageData.meta.endsAt), 'auto', true) : 'never';

			let renewsAt = subageData.meta?.renewsAt ? 'in ' + ob.utils.timeDelta(new Date(subageData.meta.renewsAt), 'auto', true) : 'never';

			let gift = subageData.meta?.giftMeta ? subageData.meta.giftMeta : null;

			let saReturn: string;

			let streak = subageData.streak?.months ? ` with a streak of ${subageData.streak.months} months` : '';

			if (subageData.statusHidden) {
				if (subageData.meta.type === 'paid') {
					if (dnr) {
						// prettier-ignore
						saReturn = `${await ob.utils.smartObfuscate(Channel, subageData.user.login, user)} has their subscription to ${await ob.utils.smartObfuscate(
							Channel,
							subageData.channel.login,
							user
						)} hidden with a Tier ${tier} sub ${streak} and ends ${endsAt}`;
					} else {
						// prettier-ignore
						saReturn = `${await ob.utils.smartObfuscate(Channel, subageData.user.login, user)} has their subscription to ${await ob.utils.smartObfuscate(
							Channel,
							subageData.channel.login,
							user
						)} hidden with a Tier with a Tier ${tier} sub ${streak} and renews ${renewsAt}`;
					}
				} else if (subageData.meta.type === 'gift') {
					// prettier-ignore
					saReturn = `${await ob.utils.smartObfuscate(Channel, subageData.user.login, user)} has their subscription to ${await ob.utils.smartObfuscate(
						Channel,
						subageData.channel.login,
						user
					)} hidden with a gifted subscription by ${gift.gifter.login} and ends ${endsAt}`;
				} else if (subageData.meta.type === 'prime') {
					// prettier-ignore
					saReturn = `${await ob.utils.smartObfuscate(Channel, subageData.user.login, user)} has their subscription to ${await ob.utils.smartObfuscate(
						Channel,
						subageData.channel.login,
						user
					)} hidden with a Prime subscription and ends ${endsAt}`;
				}
			} else {
				if (subageData.meta.type === 'paid') {
					if (dnr) {
						if (!subageData.meta?.endsAt) {
							saReturn = `${await ob.utils.smartObfuscate(Channel, subageData.user.login, user)} has been subscribed to ${await ob.utils.smartObfuscate(
								Channel,
								subageData.channel.login,
								user
							)} for ${subageData.cumulative.months} month(s) with a Tier ${tier} sub ${streak}. This is a permanent sub!`;
						}
						// prettier-ignore
						saReturn = `${await ob.utils.smartObfuscate(Channel, subageData.user.login, user)} has been subscribed to ${await ob.utils.smartObfuscate(
							Channel,
							subageData.channel.login,
							user
						)} for ${subageData.cumulative.months} month(s) with a Tier ${tier} sub ${streak} and ends ${endsAt}`;
					} else {
						// prettier-ignore
						saReturn = `${await ob.utils.smartObfuscate(Channel, subageData.user.login, user)} has been subscribed to ${await ob.utils.smartObfuscate(
							Channel,
							subageData.channel.login,
							user
						)} for ${subageData.cumulative.months} month(s) with a Tier ${tier} sub ${streak}${
							renewsAt !== 'never' ? ` and renews ${renewsAt}` : '. This is a permanent sub!'
						}`;
					}
				} else if (subageData.meta.type === 'gift') {
					// prettier-ignore
					saReturn = `${await ob.utils.smartObfuscate(Channel, subageData.user.login, user)} has been subscribed to ${await ob.utils.smartObfuscate(
						Channel,
						subageData.channel.login,
						user
					)} with a gifted subscription by ${gift.gifter.login} for ${subageData.cumulative.months} month(s) with a Tier ${tier} sub ${streak} and ends ${endsAt}`;
				} else if (subageData.meta.type === 'prime') {
					// prettier-ignore
					saReturn = `${await ob.utils.smartObfuscate(Channel, subageData.user.login, user)} has been subscribed to ${await ob.utils.smartObfuscate(
						Channel,
						subageData.channel.login,
						user
					)} with a Prime subscription for ${subageData.cumulative.months} month(s) ${streak} and ends ${endsAt}`;
				}
			}

			return {
				success: true,
				message: saReturn,
			};
		} else {
			if (subageData.cumulative.months > 0) {
				let endedAt = ob.utils.timeDelta(new Date(subageData.cumulative?.end), 'auto', true);

				// prettier-ignore
				return {
					success: true,
					message: `${await ob.utils.smartObfuscate(Channel, subageData.user.login, user)} has previously been subscribed to ${await ob.utils.smartObfuscate(
						Channel,
						subageData.channel.login,
						user
					)} for ${subageData.cumulative.months} months, however it ended ${endedAt} ago`,
				};
			} else {
				return {
					success: true,
					message: `${await ob.utils.smartObfuscate(Channel, subageData.user.login, user)} has never been subscribed to ${await ob.utils.smartObfuscate(
						Channel,
						subageData.channel.login,
						user
					)}`,
				};
			}
		}
	};
})();
