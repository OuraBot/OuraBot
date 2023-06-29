import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import ms from 'ms';
import { type } from 'os';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, NukeMessage, Permission, PlatformEnum } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'nuke';
	description = 'Timeout or ban users who have sent a specific message in the last X minutes';
	usage = 'nuke <message that can include spaces | /regex/ - gi modifiers are added> <lookback time> <timeout time|ban> <--dry-run?>';
	userCooldown = 10;
	channelCooldown = 5;
	permissions = [Permission.Broadcaster, Permission.Moderator];
	category = CategoryEnum.Moderation;
	platforms = [PlatformEnum.Twitch];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (!args[0])
			return {
				success: false,
				message: 'Missing message/regex',
			};

		if (!args[1])
			return {
				success: false,
				message: 'Missing lookback time',
			};

		if (!args[2])
			return {
				success: false,
				message: 'Missing timeout time',
			};

		const targetMessage = args.slice(0, args.length - 2).join(' ');
		const permaban = args[args.length - 1] === 'ban' || args[args.length - 1] === 'permaban' || args[args.length - 1] === '-1';

		const lookbackTime = ms(args[args.length - 2]) / 1000;
		const timeoutTime = ms(args[args.length - 1]) / 1000;
		const dryrun = args.includes('--dry-run');

		if (isNaN(lookbackTime))
			return {
				success: false,
				message: 'Invalid lookback time',
			};

		if (!permaban && isNaN(timeoutTime))
			return {
				success: false,
				message: 'Invalid timeout time',
			};

		if (lookbackTime > ms('30m') / 1000)
			return {
				success: false,
				message: 'Lookback time cannot be greater than 30 minutes',
			};

		const channelNukeMessages: NukeMessage[] = ob.nukeMessages.filter((nukeMessage) => nukeMessage.channel === Channel.channel);

		if (channelNukeMessages.length == 0)
			return {
				success: false,
				message: 'No valid messages have been sent here for at least 30 minutes',
			};

		let usingRegex: boolean = false;
		let usersToTimeout: string[] = [];
		if (targetMessage.startsWith('/') && targetMessage.endsWith('/')) {
			let regex: RegExp;
			try {
				regex = new RegExp(targetMessage.slice(1, targetMessage.length - 1), 'gi');
			} catch (e) {
				return {
					success: false,
					message: 'Invalid regex',
				};
			}

			usingRegex = true;

			channelNukeMessages.forEach((nukeMessage) => {
				if (nukeMessage.message.match(regex)) usersToTimeout.push(nukeMessage.user);
			});
		} else {
			channelNukeMessages.forEach((nukeMessage) => {
				if (nukeMessage.message.includes(targetMessage.toLowerCase())) usersToTimeout.push(nukeMessage.user);
			});
		}

		if (usersToTimeout.length == 0)
			return {
				success: false,
				message: `No users were found using the provided ${usingRegex ? 'regex' : 'message'}`,
			};

		usersToTimeout = [...new Set(usersToTimeout)];

		// prettier-ignore
		const URL = await ob.utils.upload(`Nuke from ${Channel.channel} at ${new Date()}\nChecked against ${usingRegex ? 'regex' : 'message'}: "${targetMessage}"\n\n${usersToTimeout.length} user(s) nuked for ${permaban ? 'PERMABAN' : timeoutTime + 's'}\n\nUsers:\n${usersToTimeout.join('\n')}`);

		// If the whisper is silently dropped, too bad!
		ob.twitch.apiClient.whispers.sendWhisper(ob.config.twitch_id, msg.userInfo.userId, `Nuke report from ${Channel.channel}: ${URL}`);

		if (!dryrun) {
			for (const user of usersToTimeout) {
				ob.twitch.apiClient.moderation.banUser(Channel.id, ob.config.twitch_id, {
					reason: `Nuked with ${usingRegex ? 'regex' : 'message'}: "${targetMessage}"`,
					user: user,
					duration: permaban ? undefined : timeoutTime,
				});
			}
		}

		return {
			success: true,
			message: null,
		};
	};
})();
