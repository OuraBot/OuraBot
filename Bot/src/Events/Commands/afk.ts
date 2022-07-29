import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import { AfkStatuses } from '../../Utils/Afk';

const foodEmojis = [
	'🍋',
	'🍞',
	'🥐',
	'🥖',
	'🥨',
	'🥯',
	'🥞',
	'🧀',
	'🍖',
	'🍗',
	'🥩',
	'🥓',
	'🍔',
	'🍟',
	'🍕',
	'🌭',
	'🥪',
	'🌮',
	'🌯',
	'🥙',
	'🍳',
	'🥘',
	'🍲',
	'🥣',
	'🥗',
	'🍿',
	'🥫',
	'🍱',
	'🍘',
	'🍙',
	'🍚',
	'🍛',
	'🍜',
	'🍝',
	'🍠',
	'🍢',
	'🍣',
	'🍤',
	'🍥',
	'🍡',
	'🥟',
	'🥠',
	'🥡',
	'🍦',
	'🍧',
	'🍨',
	'🍩',
	'🍪',
	'🎂',
	'🍰',
	'🥧',
	'🍫',
	'🍬',
	'🍭',
	'🍮',
	'🍯',
];

export const cmd = new (class command implements Command {
	name = 'afk';
	description = 'Set an AFK status. Use aliases for other statuses.';
	usage = 'afk <status?>';
	aliases = ['brb', 'lurk', 'gn', 'food'];
	userCooldown = 10;
	channelCooldown = 0;
	category = CategoryEnum.Fun;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let reason: string;
		if (!args[0]) {
			switch (alias) {
				case 'afk':
					reason = '(no message)';
					break;

				case 'brb':
					reason = '(no message)';
					break;

				case 'lurk':
					reason = '';
					break;

				case 'gn':
					reason = '🛌';
					break;

				case 'food':
					reason = `OpieOP ${foodEmojis[Math.floor(Math.random() * foodEmojis.length)]}`;
					break;
			}
		} else {
			reason = args.join(' ');
		}
		reason = ob.utils.formatMessage(reason, true);

		if (reason.length > 400)
			return {
				success: false,
				message: 'AFK message is too long',
				reducedCooldown: 2,
			};

		let afkMessage: string;
		let verb: string;
		switch (alias) {
			case 'gn':
				afkMessage = `${reason} 💤`;
				verb = 'sleeping';
				break;

			case 'lurk':
				afkMessage = `${reason} 👥`;
				verb = 'lurking';
				break;

			default:
				afkMessage = `${reason}`;
				verb = 'afk';
				break;
		}

		await ob.AfkManager.createAfk(msg.userInfo.userId, alias as AfkStatuses, afkMessage);

		return {
			message: `${user} is now ${verb}: ${ob.utils.formatMessage(afkMessage, true)}`,
			success: true,
			noping: true,
		};
	};
})();
