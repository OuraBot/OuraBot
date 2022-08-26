import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { CategoryEnum, Channel, Command, CommandReturn } from '../../Typings/Twitch';
import { EnvironmentVariables } from '../../Utils/env';
import { LASTFM_USERNAME_REGEX } from '../../Utils/Redis/Events/UPDATE/Settings';

type LastfmTrack = {
	artist: {
		mbid: string;
		'#text': string;
	};
	streamable: string;
	image: {
		size: string;
		'#text': string;
	}[];
	mbid: string;
	album: {
		mbid: string;
		'#text': string;
	};
	name: string;
	url: string;
	date: { uts: string; '#text': string };
};

type NowPlayingResponse = {
	recenttracks: {
		track: LastfmTrack[];
		'@attr': {
			user: string;
			totalPages: string;
			page: string;
			perPage: string;
			total: string;
		};
	};
};

export const cmd = new (class command implements Command {
	name = 'nowplaying';
	description = 'Get the current song playing on Last.fm.';
	usage = 'nowplaying <username?>';
	aliases = ['lastfm', 'np', 'lastfmsong', 'song'];
	userCooldown = 30;
	channelCooldown = 15;
	category = CategoryEnum.Utility;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		if (EnvironmentVariables.LAST_FM_TOKEN === undefined) return { success: false, message: 'Last.fm API key is unavailable.' };

		if (Channel.lastfmUsername === '' && args.length === 0) {
			return {
				message: 'This streamer has not set a Last.fm username for this command.',
				success: false,
			};
		}

		const lastFmUsername = LASTFM_USERNAME_REGEX.test(args[0] || Channel.lastfmUsername) ? args[0] || Channel.lastfmUsername : null;
		LASTFM_USERNAME_REGEX.lastIndex = 0;
		if (lastFmUsername === null) {
			return {
				message: `Invalid Last.fm username.`,
				success: false,
			};
		}

		const resp = await ob.api.get<NowPlayingResponse>(
			`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${args[0] || Channel.lastfmUsername}&api_key=${
				EnvironmentVariables.LAST_FM_TOKEN
			}&format=json&limit=1`,
			30
		);
		if (resp.error) {
			return {
				message: 'Error getting the latest track from Last.fm',
				success: false,
			};
		}
		const track = resp.data.response.data.recenttracks.track[0];

		if (!track) {
			return {
				message: 'No recent tracks found.',
				success: false,
			};
		} else {
			return {
				message: `${args[0] || Channel.channel}'s most recent track is: ${track.name} - ${track.artist['#text']}`,
				success: true,
			};
		}
	};
})();
