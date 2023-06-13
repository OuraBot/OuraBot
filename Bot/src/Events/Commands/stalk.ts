import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { SQLMessage } from '../../Utils/SQLite';

export const cmd = new (class command implements Command {
	name = 'stalk';
	description = 'Get the last message of a user';
	usage = 'stalk';
	userCooldown = 10;
	channelCooldown = 0;
	aliases = ['lastseen', 'ls'];
	category = CategoryEnum.Fun;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let targetUser = args[0]?.toLowerCase();
		if (!targetUser)
			return {
				success: false,
				message: 'Missing user',
			};

		if (targetUser === 'oura_bot') {
			let bestEmote = await ob.utils.getBestAvailableEmote(Channel, ['PepeA', 'monkaStare', 'ForsenLookingAtYou', 'Stare'], '😳');
			return {
				success: true,
				message: `${bestEmote} I am right here...`,
			};
		}

		if (targetUser === user.toLowerCase()) {
			let bestEmote = await ob.utils.getBestAvailableEmote(Channel, ['PepeA', 'monkaStare', 'ForsenLookingAtYou', 'Stare'], '😳');
			return {
				success: true,
				message: `${bestEmote} You are right here...`,
			};
		}

		let resolvedUser = await ob.utils.resolveUserByUsername(targetUser);
		if (!resolvedUser)
			return {
				success: false,
				message: `Invalid user`,
			};

		const sqlUser = await ob.sqlite.getUser(resolvedUser.id);

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

		const msgs = await ob.sqlite.query(`SELECT * FROM messages WHERE userId = ? ORDER BY date DESC LIMIT 1`, [resolvedUser.id]);

		const sqlMsg = msgs[0] as SQLMessage;
		const date = ob.utils.SQLiteDateToDate(sqlMsg.date);

		let resolvedChannel = await ob.utils.resolveUserById(sqlMsg.channelId);
		if (!resolvedChannel) throw new Error('Channel not found');

		return {
			success: true,
			message: `That user was last seen ${ob.utils.timeDelta(date, 'seconds')} in #${ob.utils.obfuscateStr(
				resolvedChannel.login
			)}. Their last message was: ${ob.utils.formatMessage(sqlMsg.message)}`,
		};
	};
})();
