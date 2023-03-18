import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';

const PREFIX_REGEX = /^[a-zA-Z0-9!@#%^&*()-=_+;:'"<>,./?`~]{1,5}$/;

const DISCORD_WEBHOOK_REGEX = /(^https:\/\/discord.com\/api\/webhooks\/[0-9]+\/.+$|^$)/;
export const LASTFM_USERNAME_REGEX = /(^[a-zA-Z0-9_\-]{2,15}$|^$)/;

export default function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		const channel = await ob.db.models.Channel.model.findOne({
			id: Event.userId,
		});

		const newPrefix = Event.data.prefix;
		let shouldAnnouncePrefix = false;

		if (newPrefix !== channel.prefix) {
			if (!PREFIX_REGEX.test(newPrefix)) {
				return resolve({
					...Event,
					status: StatusCodes.BadRequest,
					data: {
						error: 'invalid prefix',
					},
				});
			}

			PREFIX_REGEX.lastIndex = 0;

			channel.prefix = newPrefix;
			shouldAnnouncePrefix = true;
		}

		const newClipUrl = Event.data.clipUrl.trim();

		if (newClipUrl !== channel.clipUrl) {
			if (!DISCORD_WEBHOOK_REGEX.test(newClipUrl)) {
				return resolve({
					...Event,
					status: StatusCodes.BadRequest,
					data: {
						error: 'invalid clipUrl',
					},
				});
			}

			DISCORD_WEBHOOK_REGEX.lastIndex = 0;

			channel.clipUrl = newClipUrl;
		}

		const newLastfmUsername = Event.data.lastfmUsername.trim();

		if (newLastfmUsername !== channel.lastfmUsername) {
			if (!LASTFM_USERNAME_REGEX.test(newLastfmUsername)) {
				return resolve({
					...Event,
					status: StatusCodes.BadRequest,
					data: {
						error: 'invalid lastfmUsername',
					},
				});
			}
			LASTFM_USERNAME_REGEX.lastIndex = 0;

			channel.lastfmUsername = newLastfmUsername;
		}

		if (typeof Event.data.emoteEventsEnabled !== 'boolean') {
			return resolve({
				...Event,
				status: StatusCodes.BadRequest,
				data: {
					error: 'malformed emoteEventsEnabled value',
				},
			});
		}

		await channel.save();

		if (shouldAnnouncePrefix) ob.twitch.say(channel.login, `Prefix has been changed to ${newPrefix}`);
		ob.CacheManager.clear(`${channel.id}_channelInfo`);

		resolve({
			...Event,
			status: StatusCodes.OK,
			data: {
				prefix: channel.prefix,
				clipUrl: channel.clipUrl,
				lastfmUsername: channel.lastfmUsername
			},
		});
	});
}
