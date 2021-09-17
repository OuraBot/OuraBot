import axios from 'axios';
import * as dotenv from 'dotenv';
import { redis } from '../..';
dotenv.config();

export class LastfmUsername {
    channel: string;
    LastfmUsername: string;
}

class NowPlayingReturnClass {
    result: string;
    artist: string;
    success: boolean;
    LastfmUsername: string;
}

export async function getNowPlaying(user: string, ignoreredis?: boolean): Promise<NowPlayingReturnClass> {
    let targetUser: string;

    if (!ignoreredis) {
        const LastfmUsername = JSON.parse(await redis.get(`ob:lastfmusername`));

        if (!LastfmUsername || !LastfmUsername.map((e: LastfmUsername) => e.channel).includes(user.replace('#', '')))
            return {
                result: 'No Last.fm username set for this channel',
                artist: null,
                success: false,
                LastfmUsername: null,
            };

        let obj = LastfmUsername.filter((e: LastfmUsername) => e.channel === user.replace('#', ''));

        targetUser = obj[0].LastfmUsername;
    } else {
        targetUser = user;
    }

    let lastfmAPI = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${targetUser}&api_key=${process.env.LASTFMKEY}&format=json&limit=1`;
    let resp;
    try {
        resp = await axios.get(lastfmAPI);
    } catch (err) {
        if (err.response.status === 404)
            return {
                result: 'Last.fm username not found',
                artist: null,
                success: false,
                LastfmUsername: null,
            };
        return {
            result: 'There was an error while contacting the Last.fm API NotLikeThis',
            artist: null,
            success: false,
            LastfmUsername: null,
        };
    }

    let data = resp.data.recenttracks.track[0];
    console.log(data);

    if (!data)
        return {
            result: null,
            artist: null,
            success: true,
            LastfmUsername: targetUser,
        };

    return {
        result: data['name'],
        artist: data['artist']['#text'],
        success: true,
        LastfmUsername: targetUser,
    };
}
