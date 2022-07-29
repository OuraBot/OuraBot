import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { SevenTVEvents } from '../../Utils/SevenTVEvents';

export const cmd = new (class command implements Command {
	name = 'bing';
	description = 'Pings a random user in the chat';
	usage = 'bing';
	userCooldown = 10;
	channelCooldown = 5;
	category = CategoryEnum.Fun;
	modifiablePermissions = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		let chattersResponse = await ob.utils.getChatters(Channel);

		let bestEmote = await ob.utils.getBestAvailableEmote(Channel, ['pajaDink', 'dinkDonk', 'DinkDonk'], ':tf: 🔔');

		let chatters: string[] = [];

		if (!chattersResponse) chatters = [user];
		else
			chatters = chattersResponse.chatters.admins
				.concat(chattersResponse.chatters.global_mods)
				.concat(chattersResponse.chatters.moderators)
				.concat(chattersResponse.chatters.staff)
				.concat(chattersResponse.chatters.vips)
				.concat(chattersResponse.chatters.broadcaster);

		return {
			success: true,
			message: `${bestEmote} ${chatters[Math.floor(Math.random() * chatters.length)]}`,
		};
	};
})();
