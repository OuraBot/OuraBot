import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, PlatformEnum } from '../../Typings/Twitch';
import { SQLMessage } from '../../Utils/SQLite';

export const cmd = new (class command implements Command {
	name = 'rl';
	description = 'Get a random line from this channel';
	usage = 'rl';
	userCooldown = 5;
	channelCooldown = 0;
	category = CategoryEnum.Fun;
	modifiablePermissions = true;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		const msgs = await ob.sqlite.query(`SELECT * FROM messages WHERE channelId = ? ORDER BY RANDOM() LIMIT 1`, [Channel.id]);

		const sqlMsg = msgs[0] as SQLMessage;
		const date = ob.utils.SQLiteDateToDate(sqlMsg.date);

		const sqlUser = await ob.sqlite.getUser(sqlMsg.userId);

		if (!sqlUser)
			return {
				success: true,
				message: `I have not seen this user across any of the channels I am in`,
			};

		if (sqlUser.hideLogs)
			return {
				success: true,
				message: `This user has opted out of having their logs displayed`,
			};

		let userResp = await ob.utils.resolveUserById(sqlMsg.userId);

		return {
			success: true,
			message: `(${ob.utils.timeDelta(date)}) ${await ob.utils.smartObfuscate(Channel, userResp.login, user)}: ${sqlMsg.message}`,
		};
	};
})();
