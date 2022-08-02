import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, Permission } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

const MAXIMUM_FILE_LENGTH = 5000;

export const cmd = new (class command implements Command {
	name = 'filesay';
	description = 'Read a file (useful for banning bots). The formatting string can be used to add /ban before the message or any other text';
	usage = 'filesay <url> <--silent?> [formatting string; use %line% for the message and %idx% for the line number - ?]';
	userCooldown = 10;
	channelCooldown = 5;
	permissions = [Permission.Broadcaster, Permission.Moderator];
	category = CategoryEnum.Moderation;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (!args[0])
			return {
				success: false,
				message: 'Missing URL',
			};

		let url = ob.utils.urlsFromString(args[0])[0];
		if (!url)
			return {
				success: false,
				message: 'Invalid URL',
			};

		const silent = args[1] === '--silent';

		url.replace(/^(https?:\/\/)?(www\.)?/, '');

		let urlData = await ob.api.get<string>(url, 0, {
			headers: {
				'X-OuraBot-Channel': Channel.channel,
				'X-OuraBot-ChannelId': Channel.id,
				'X-OuraBot-User': user,
				'X-OuraBot-UserId': msg.userInfo.userId,
				'X-OuraBot-Info': 'twitch.tv/oura_bot',
			},
			timeout: 5000,
		});

		if (urlData.error)
			return {
				success: false,
				message: `Error while fetching provided url: ${urlData.error?.code}`,
			};

		if (!urlData.data.response.headers['content-type'].startsWith('text/plain'))
			return {
				success: false,
				message: 'Content-Type is not text/plain',
			};

		let lines = urlData.data.response.data.split('\n');
		if (lines.length > MAXIMUM_FILE_LENGTH)
			return {
				success: false,
				message: `File is too long (maximum of ${lines.length} lines)`,
			};

		lines = lines.map((line, index) => {
			let lineNumber = index + 1;
			let formattedLine = line;
			if (args[1]) {
				formattedLine = args
					.slice(1)
					.join(' ')
					.replace(/%line%/g, line)
					.replace(/%idx%/g, lineNumber.toString());
			}
			return formattedLine;
		});

		if (!silent) ob.twitch.say(Channel, `${lines.length} lines...`);
		ob.twitch.say(Channel, lines, 0.05, 'filesay');

		return {
			success: true,
			message: null,
		};
	};
})();
