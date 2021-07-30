import axios from 'axios';
import { redis } from '../..';
import { error } from '../logger';

export class ResolveUser {
    success: boolean;
    user: any;
}

export async function resolveUser(user: string): Promise<ResolveUser> {
    let targetuser = user.toLowerCase().replace('@', '').replace(',', '');
    try {
        let redisData = await redis.get(`cache:ivr/twitch/resolve/${targetuser}`);
        let resp;
        if (redisData) {
            resp = JSON.parse(redisData);
            return {
                success: true,
                user: resp,
            };
        } else {
            let resp = await axios.get(`https://api.ivr.fi/twitch/resolve/${targetuser}`);
            await redis.set(`cache:ivr/twitch/resolve/${targetuser}`, JSON.stringify(resp.data), 'EX', 1800);
            return {
                success: true,
                user: resp.data,
            };
        }
    } catch (e) {
        return {
            success: false,
            user: null,
        };
    }
}

export class UserBot {
    success: boolean;
    user: any;
}

export async function isUserBot(user: string): Promise<UserBot> {
    let targetuser = user.toLowerCase().replace('@', '').replace(',', '');
    try {
        let redisData = await redis.get(`cache:ivr/twitch/bot/${targetuser}`);
        let resp;
        if (redisData) {
            resp = JSON.parse(redisData);
            return {
                success: true,
                user: resp,
            };
        } else {
            let resp = await axios.get(`https://api.ivr.fi/twitch/bot/${targetuser}`);
            await redis.set(`cache:ivr/twitch/bot/${targetuser}`, JSON.stringify(resp.data), 'EX', 1);
            return {
                success: true,
                user: resp.data,
            };
        }
    } catch (e) {
        return {
            success: false,
            user: null,
        };
    }
}

export class SubageLookup {
    success: boolean;
    data: any;
}

export async function subageLookup(user: string, channel: string): Promise<SubageLookup> {
    let targetuser = user.toLowerCase().replace('@', '').replace(',', '');
    let targetchannel = channel.toLowerCase().replace('@', '').replace(',', '');
    try {
        let redisData = await redis.get(`cache:ivr/twitch/subage/${targetuser}/${targetchannel}`);
        let resp;
        if (redisData) {
            resp = JSON.parse(redisData);
            return {
                success: true,
                data: resp,
            };
        } else {
            let resp = await axios.get(`https://api.ivr.fi/twitch/subage/${targetuser}/${targetchannel}`);
            await redis.set(`cache:ivr/twitch/subage/${targetuser}/${targetchannel}`, JSON.stringify(resp.data), 'EX', 1);
            return {
                success: true,
                data: resp.data,
            };
        }
    } catch (e) {
        console.log(e);
        return {
            success: false,
            data: null,
        };
    }
}

export class ClipInfoReturnClass {
    realClip: boolean;
    qualities: Array<any>;
    clipKey: string;
    duration: number;
    broadcaster: {
        id: string;
        displayName: string;
    };
    curator: {
        id: string;
        displayName: string;
    };
    title: string;
    viewCount: number;
    error: string;
}

export async function clipInfo(slug: string): Promise<ClipInfoReturnClass> {
    try {
        const legacyClipRegex: RegExp = /[a-z0-9]+/i;
        const modernClipRegex: RegExp = /[a-z0-9]+-[-\w]{16}/gi;
        const match = slug.match(modernClipRegex) ?? slug.match(legacyClipRegex);
        if (!match)
            return {
                realClip: false,
                qualities: [],
                clipKey: null,
                duration: null,
                broadcaster: {
                    id: null,
                    displayName: null,
                },
                curator: {
                    id: null,
                    displayName: null,
                },
                title: null,
                viewCount: null,
                error: null,
            };

        const [matchedSlug] = match;
        let data = await axios.get(`https://api.ivr.fi/v2/twitch/getClip/${matchedSlug}`);

        const source = Object.entries(data.data.clip.videoQualities).sort((a: any, b: any) => Number(a['quality']) - Number(b['quality']))[0][1];

        data.data.clip.videoQualities.push(source);

        return {
            realClip: true,
            qualities: data.data.clip.videoQualities,
            clipKey: data.data.clipKey,
            duration: data.data.clip.durationSeconds,
            broadcaster: {
                id: data.data.clip.broadcaster.id,
                displayName: data.data.clip.broadcaster.displayName,
            },
            curator: {
                id: data.data.clip.curator.id,
                displayName: data.data.clip.curator.displayName,
            },
            title: data.data.clip.title,
            viewCount: data.data.clip.viewCount,
            error: null,
        };
    } catch (err) {
        return {
            realClip: false,
            qualities: [],
            clipKey: null,
            duration: null,
            broadcaster: {
                id: null,
                displayName: null,
            },
            curator: {
                id: null,
                displayName: null,
            },
            title: null,
            viewCount: null,
            error: err,
        };
    }
}
