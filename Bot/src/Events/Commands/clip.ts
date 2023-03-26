import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import { HelixClip } from '@twurple/api/lib';
import { getRawData } from '@twurple/common';
import axios from 'axios';

export const cmd = new (class command implements Command {
	name = 'clip';
	description = 'Clip the last 30s and send it to the configured Discord webhook (in settings)';
	usage = 'clip <title?>';
	userCooldown = 30;
	channelCooldown = 15;
	modifiablePermissions = true;
	category = CategoryEnum.Utility;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		const clipUrl = Channel.clipUrl;

		if (clipUrl.length == 0)
			return {
				success: false,
				message: 'Discord webhook is not configured. It can be configured here: https://ourabot.com/dashboard/settings',
			};

		const streamResp = await ob.twitch.apiClient.streams.getStreamByUserId(Channel.id);
		if (!streamResp)
			return {
				success: false,
				message: 'This channel is currently offline FailFish',
			};

		await ob.twitch.say(Channel, `GivePLZ Creating your clip...`, null, null, msg.id);

		let clipRes: string;

		try {
			clipRes = await ob.twitch.apiClient.clips.createClip({
				channel: Channel.id,
				createAfterDelay: true,
			});
		} catch (e) {
			return {
				success: false,
				message: 'Failed to create clip (does this channel have clips disabled?) NotLikeThis',
			};
		}

		let clippedRes: HelixClip;
		let attempts = 5;

		// Exponential backoff since it takes time to create a clip
		let backoff = 5000;
		while (!clippedRes && attempts > 0) {
			await new Promise((resolve) => setTimeout(resolve, backoff));
			backoff *= 1.5;
			clippedRes = await ob.twitch.apiClient.clips.getClipById(clipRes);
			attempts--;
		}

		if (!clippedRes || attempts == 0)
			return {
				success: false,
				message: 'Failed to create a clip, please try again later NotLikeThis',
			};

		const userResp = await ob.utils.resolveUserById(Channel.id, 60 * 60 * 12);

		ob.api.post(clipUrl, {
			content: null,
			embeds: [
				{
					title: (args.length > 0 ? args.join(' ') : clippedRes.title.length > 0 ? clippedRes.title : 'Untitled').replace('@', '@\u200b'),
					url: clippedRes.url,
					color: 9520895, // Twitch purple
					author: {
						name: `${clippedRes.broadcasterDisplayName} playing ${streamResp.gameName.length > 0 ? streamResp.gameName : '<no game>'}`,
						url: `https://twitch.tv/${Channel.channel}`,
						icon_url: userResp.logo,
					},
					footer: {
						text: `Clipped by ${user}`,
					},
					timestamp: new Date(),
					thumbnail: {
						url: clippedRes.thumbnailUrl,
					},
				},
			],
			username: 'OuraBot',
			avatar_url: 'https://static-cdn.jtvnw.net/jtv_user_pictures/a4efe243-b362-447a-9e0c-04b56a0f2657-profile_image-600x600.png',
			attachments: [],
		});

		return {
			success: true,
			message: `Your clip has been created and sent to the Discord! SeemsGood ${clippedRes.url}`,
		};
	};
})();
