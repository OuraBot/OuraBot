import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn, Permission } from '../../Typings/Twitch';
import { SevenTVEvents } from '../../Utils/SevenTVEvents';

export const cmd = new (class command implements Command {
	name = 'bingall';
	description = 'Pings all the users in the chat with an optional message';
	usage = 'bingall <message?>';
	aliases = ['chaos', 'massping'];
	userCooldown = 30;
	channelCooldown = 30;
	category = CategoryEnum.Fun;
	modifiablePermissions = true;
	permissions = [Permission.Broadcaster];
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let chattersResponse = await ob.utils.getChatters(Channel);

		let message = args.join(' ');
		if (!message) {
			message = await ob.utils.getBestAvailableEmote(Channel, ['pajaDink', 'dinkDonk', 'DinkDonk'], ':tf: 🔔');
		}

		let chatters: string[] = [];

		if (!chattersResponse) chatters = [user];
		else
			chatters = chattersResponse.chatters.admins
				.concat(chattersResponse.chatters.global_mods)
				.concat(chattersResponse.chatters.moderators)
				.concat(chattersResponse.chatters.staff)
				.concat(chattersResponse.chatters.vips)
				.concat(chattersResponse.chatters.broadcaster);

		let msgs = chatters.map((c) => `${message} ${c}`);

		ob.twitch.say(Channel, msgs, 0.05, 'bingall');

		return {
			success: true,
			message: null,
		};
	};
})();
