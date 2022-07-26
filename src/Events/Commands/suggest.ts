import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'suggest';
	description = 'Suggest a new feature or report a bug';
	usage = 'suggest <suggestion/bug>';
	aliases = ['ob_suggest'];
	userCooldown = 30;
	channelCooldown = 0;
	category = CategoryEnum.Utility;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		const suggestion = args.join(' ');

		const suggestionId = await ob.sqlite.createSuggestion(msg.userInfo.userId, Channel.id, suggestion, 'pending', msg.userInfo.userName, Channel.channel);

		return {
			success: true,
			message: `Your suggestion has been submitted! If this was a mistake, use the unsuggest command to remove it (ID: #${suggestionId})`,
		};
	};
})();
