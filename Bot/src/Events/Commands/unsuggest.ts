import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'unsuggest';
	description = 'Unsuggest a suggestion by ID';
	usage = 'unsuggest <id>';
	userCooldown = 10;
	channelCooldown = 0;
	permission = 1;
	category = CategoryEnum.Utility;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		const suggestionId = args[0];
		if (!suggestionId) {
			return {
				success: false,
				message: 'Missing ID',
			};
		}

		if (!suggestionId.match(/^[0-9]+$/))
			return {
				success: false,
				message: 'Invalid ID',
			};

		const suggestion = await ob.sqlite.query(`SELECT * FROM "suggestions" WHERE id = ? AND userId = ?`, [suggestionId, msg.userInfo.userId]);

		if (!suggestion.length)
			return {
				success: false,
				message: 'Suggestion not found',
			};

		if (suggestion[0].status !== 'pending')
			return {
				success: false,
				message: 'Suggestion has already been looked at',
			};

		await ob.sqlite.query(`UPDATE "suggestions" SET status = 'dismissed' WHERE id = ?`, [suggestionId]);

		return {
			success: true,
			message: `Suggestion ID: #${suggestionId} has been dismissed`,
		};
	};
})();
