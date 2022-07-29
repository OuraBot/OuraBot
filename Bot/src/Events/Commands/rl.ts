import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { SevenTVEvents } from '../../Utils/SevenTVEvents';
import { SQLMessage } from '../../Utils/SQLite';

export const cmd = new (class command implements Command {
	name = 'rl';
	description = 'Get a random line from this channel';
	usage = 'rl';
	userCooldown = 5;
	channelCooldown = 0;
	category = CategoryEnum.Fun;
	modifiablePermissions = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		const msgs = await ob.sqlite.query(`SELECT * FROM messages WHERE channelId = ? ORDER BY RANDOM() LIMIT 1`, [Channel.id]);

		const sqlMsg = msgs[0] as SQLMessage;
		const date = ob.utils.SQLiteDateToDate(sqlMsg.date);

		if (await ob.utils.shouldHideLogs(sqlMsg.userId)) {
			return {
				success: true,
				message: `This user has opted out of having their logs displayed`,
			};
		}

		let userResp = await ob.utils.resolveUserById(sqlMsg.userId);

		return {
			success: true,
			message: `(${ob.utils.timeDelta(date)}) ${await ob.utils.smartObfuscate(Channel, userResp.login, user)}: ${sqlMsg.message}`,
		};
	};
})();
