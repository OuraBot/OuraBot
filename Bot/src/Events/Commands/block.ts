import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, Permission, PlatformEnum } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'block';
	description = 'Block a user from using a command';
	usage = 'block <userid> <command?>';
	userCooldown = 0;
	channelCooldown = 0;
	permission = [Permission.Admin];
	hidden = true;
	category = CategoryEnum.Utility;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (!args[0])
			return {
				success: false,
				message: 'Missing user',
			};

		let blockedData = await ob.sqlite.query(`SELECT * FROM blockedusers WHERE userid = ?`, [args[0]]);
		if (args[1]) {
			if (blockedData.includes(args[1])) {
				return {
					success: false,
					message: 'User is already blocked from using the command',
				};
			} else if (blockedData.length > 0) {
				ob.sqlite.query(`UPDATE blockedusers SET commands = ? WHERE userid = ?`, [blockedData[0].commands.concat(args[1]), args[0]]);
				ob.blockedUsers = await ob.sqlite.getBlockedUsers();
				return {
					success: true,
					message: 'User blocked from using the command',
				};
			} else {
				ob.sqlite.query(`INSERT INTO blockedusers VALUES (?, ?)`, [args[0], [args[1]]]);
				ob.blockedUsers = await ob.sqlite.getBlockedUsers();
				return {
					success: true,
					message: 'User blocked from using the command',
				};
			}
		} else {
			if (blockedData.length > 0) {
				ob.sqlite.query(`UPDATE blockedusers SET commands = ? WHERE userid = ?`, [[], args[0]]);
				ob.blockedUsers = await ob.sqlite.getBlockedUsers();
				return {
					success: true,
					message: 'User blocked from using all commands',
				};
			} else {
				ob.sqlite.query(`INSERT INTO blockedusers VALUES (?, ?)`, [args[0], []]);
				ob.blockedUsers = await ob.sqlite.getBlockedUsers();
				return {
					success: true,
					message: 'User blocked from using all commands',
				};
			}
		}
	};
})();
