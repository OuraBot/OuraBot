import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { SQLMessage } from '../../Utils/SQLite';

export const cmd = new (class command implements Command {
	name = 'firstline';
	description = "Gets your or someone else's first line in the current channel";
	usage = 'firstline <user?>';
	userCooldown = 10;
	channelCooldown = 5;
	aliases = ['fl'];
	category = CategoryEnum.Fun;
	modifiablePermissions = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let targetUserId: string;
		if (!args[0]) {
			targetUserId = msg.userInfo.userId;
		} else {
			let userResp = await ob.utils.resolveUserByUsername(args[0]);
			if (!userResp)
				return {
					success: false,
					message: `Invalid user`,
				};
			targetUserId = userResp.id;
		}

		if (await ob.utils.shouldHideLogs(targetUserId))
			return {
				success: true,
				message: `This user has opted out of having their logs displayed`,
			};

		const msgs = await ob.sqlite.query(`SELECT * FROM messages WHERE channelId = ? AND userId = ? ORDER BY date ASC LIMIT 1`, [Channel.id, targetUserId]);

		const sqlMsg = msgs[0] as SQLMessage;
		const date = ob.utils.SQLiteDateToDate(sqlMsg.date);

		return {
			success: true,
			message: `${targetUserId == msg.userInfo.userId ? 'Your' : "That user's"} first message in this channel was (${ob.utils.timeDelta(date)}): ${sqlMsg.message}`,
		};
	};
})();
