import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'stats';
	description = 'Get statistics about the bot';
	usage = 'stats';
	userCooldown = 15;
	channelCooldown = 10;
	category = CategoryEnum.Fun;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let commandCount = await ob.sqlite.query(`SELECT COUNT(*) AS count FROM usages`);
		let mostUsedCommand = await ob.sqlite.query(`SELECT command, COUNT(*) AS count FROM usages GROUP BY command ORDER BY count DESC LIMIT 1`);
		let uniqueUserCount = await ob.sqlite.query(`SELECT COUNT(DISTINCT userId) AS count FROM usages`);
		let userMostUsedCommand = await ob.sqlite.query(`SELECT command, COUNT(*) AS count FROM usages WHERE userId = ? GROUP BY command ORDER BY count DESC LIMIT 1`, [
			msg.userInfo.userId,
		]);
		let userCommandCount = await ob.sqlite.query(`SELECT COUNT(*) AS count FROM usages WHERE userId = ?`, [msg.userInfo.userId]);

		return {
			success: true,
			message: `I am currently in ${ob.channels.length} channels. ${commandCount[0].count} commands have been used. The most used command is ${mostUsedCommand[0].command} with ${mostUsedCommand[0].count} uses. There are ${uniqueUserCount[0].count} unique users. You have used ${userCommandCount[0].count} commands with ${userMostUsedCommand[0].command} being used ${userMostUsedCommand[0].count} times.`,
		};
	};
})();
