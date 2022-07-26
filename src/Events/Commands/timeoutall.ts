import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, Permission } from '../../Typings/Twitch';

let knownBots = [
	'streamlabs',
	'streamelements',
	'nightbot',
	'moobot',
	'wizebot',
	'streamdeckerbot',
	'streamkit',
	'tipeeebot',
	'logviewer',
	'buttsbot',
	'lattemotte',
	'mirrobot',
	'streamjar',
	'overrustlelogs',
	'amazeful',
	'amazefulbot',
	'creatisbot',
	'soundalerts',
	'fossabot',
	'supibot',
	'oura_bot',
];

export const cmd = new (class command implements Command {
	name = 'timeoutall';
	description = 'Timeout all users in your chat for a provided amount of seconds.';
	usage = 'timeoutall <timeout time?> <reason?>';
	userCooldown = 10;
	channelCooldown = 5;
	permissions = [Permission.Broadcaster];
	modifiablePermissions = true;
	category = CategoryEnum.Moderation;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		const chatters = (await ob.utils.getChatters(Channel)).chatters.viewers;

		const timeoutLength = parseInt(args[0]);

		if (isNaN(timeoutLength) || timeoutLength < 1 || timeoutLength > 60 * 60 * 24 * 14)
			return {
				success: false,
				message: 'Invalid timeout length',
			};

		const reason = args.slice(1).join(' ');

		ob.twitch.say(
			Channel,
			chatters
				.filter((c) => !knownBots.includes(c))
				.map((userToTimeout) => `/timeout ${userToTimeout} ${timeoutLength} ${reason ? ` Reason: ${reason}` : 'Timeoutall command used'}`),
			0.05
		);

		return {
			success: true,
			message: null,
		};
	};
})();
