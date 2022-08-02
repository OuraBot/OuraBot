import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, Permission } from '../../Typings/Twitch';
import { SevenTVEvents } from '../../Utils/SevenTVEvents';
import { parseTwitchMessage } from '@twurple/chat';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';

export const cmd = new (class command implements Command {
	name = 'yoinkbans';
	description = 'Yoink any bans from a channel';
	usage = 'yoinkbans <channel> <logs YYYY/M/D?>';
	userCooldown = 0;
	channelCooldown = 0;
	permissions = [Permission.Owner, Permission.Admin];
	category = CategoryEnum.Utility;
	hidden = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let channel = ob.utils.sanitizeName(args[0]) || Channel.channel;
		let specificDate = args[1] ?? '';

		let users: string[] = [];

		let method: 'ivrfi logs' | 'recent-messages';

		if (ob.utils.isIvrFiLoggedChannel(channel)) {
			method = 'ivrfi logs';

			// [2022-02-11 00:45:22] #auror6s forsen has been banned
			const bannedRegex = /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] #.+ (.+) has been banned/g;

			let resp = await ob.api.get<any>(`https://logs.ivr.fi/channel/${channel}/${specificDate}?json`, 0);
			if (resp.error) throw resp.error;

			let messages = resp.data.response.data.messages.filter((msg: any) => msg.type == 2 && msg.text.includes('has been banned'));

			users = messages.map((msg: any) => msg.username);
		} else {
			method = 'recent-messages';

			// tags can be different so .+ wildcards them out
			// @historical=1;msg-id=rm-permaban;rm-received-ts=1644540323016 :tmi.twitch.tv NOTICE #auror6s :forsen has been permanently banned.
			const bannedRegex = /^.+:tmi.twitch.tv\sNOTICE\s#.+\s:(.+)\shas\sbeen\spermanently\sbanned.$/;

			// prettier-ignore
			let resp = await ob.api.get<{ messages: string[] }>(`https://recent-messages.robotty.de/api/v2/recent-messages/${channel}?clearchat_to_notice=true`, 0);
			if (resp.error) throw resp.error;

			users = resp.data.response.data.messages
				.filter((line) => bannedRegex.test(line))
				.map((line) => {
					let match = bannedRegex.exec(line);
					return match[1];
				});
		}

		users = [...new Set(users)];

		let url = await ob.utils.upload(users.join('\n'));

		return {
			success: true,
			message: `${url} using ${method}`,
		};
	};
})();
