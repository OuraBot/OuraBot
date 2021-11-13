import axios from 'axios';
import { redis } from '../index';
import { resolveUser } from './apis/ivr';

class BaeReturnClass {
    allEmotes: any;
    bestAvailableEmote: string;
    cached: boolean;
    responseTime: number;
    error: any;
}

class GetAllEmotesClass {
    data: any;
    cached: boolean;
    error: any;
}

export async function getBestEmote(displayName: string, emoteOptions: string[], fallbackEmote: string): Promise<BaeReturnClass> {
    try {
        const t0 = process.hrtime();
        let emoteData = await getAllEmotes(displayName.replace('#', ''));
        const t1 = process.hrtime();

        let availableEmote: string = null;

        for (let preferredEmote of emoteOptions) {
            if (availableEmote != null) break;
            for (let emote of emoteData.data) {
                if (emote == preferredEmote) {
                    availableEmote = emote;
                    break;
                }
            }
        }

        if (availableEmote == null) availableEmote = fallbackEmote;

        let respTime = Math.round(t1[0] * 1000000 + t1[1] / 1000 - (t0[0] * 1000000 + t0[1] / 1000)) / 1000;

        return {
            allEmotes: emoteData.data,
            bestAvailableEmote: availableEmote,
            cached: emoteData.cached,
            responseTime: respTime,
            error: null,
        };
    } catch (err) {
        return {
            allEmotes: null,
            bestAvailableEmote: fallbackEmote,
            cached: null,
            responseTime: null,
            error: err,
        };
    }
}

export async function getAllEmotes(displayName: string): Promise<GetAllEmotesClass> {
    try {
        let cacheEntry = await redis.get(`bae:${displayName}`);

        if (cacheEntry) {
            return {
                data: JSON.parse(cacheEntry),
                cached: true,
                error: null,
            };
        } else {
            // Request all the APIs at the same time
            let [ffzChannelResp, bttvChannelResp, stvChannelResp, ffzGlobalResp, bttvGlobalResp, stvGlobalResp] = await Promise.all([
                getFfzChannelEmotes(displayName),
                getBttvChannelEmotes(displayName),
                getStvChannelEmotes(displayName),
                getFfzGlobalEmotes(),
                getBttvGlobalEmotes(),
                getStvGlobalEmotes(),
            ]);

            // Init an empty array
            let allEmotes = [];

            if (ffzChannelResp != null) {
                // Loop through each emote (split by spaces because Aiden's api returns a space seperated string)
                for (let emote of ffzChannelResp.split(' ')) {
                    allEmotes.push(emote);
                }
            }

            if (bttvChannelResp != null) {
                // Loop through each emote (split by spaces because Aiden's api returns a space seperated string)
                for (let emote of bttvChannelResp.split(' ')) {
                    allEmotes.push(emote);
                }
            }

            if (stvChannelResp != null) {
                // Loop through each emote
                for (let emote of stvChannelResp) {
                    allEmotes.push(emote.name);
                }

                if (stvGlobalResp != null) {
                    // Loop through each emote
                    for (let emote of stvGlobalResp) {
                        allEmotes.push(emote.name);
                    }
                }
            }

            if (ffzGlobalResp != null) {
                // Navigate to the 3rd emote set and the emoticons and loop through
                for (let emote of ffzGlobalResp.sets['3'].emoticons) {
                    allEmotes.push(emote.name);
                }
            }

            if (bttvGlobalResp != null) {
                // Loop through each emote
                for (let emote of bttvGlobalResp) {
                    allEmotes.push(emote.code);
                }
            }

            redis.set(`bae:${displayName}`, JSON.stringify(allEmotes), 'EX', 3600);

            return {
                data: allEmotes,
                cached: false,
                error: null,
            };
        }
    } catch (err) {
        return {
            data: null,
            cached: null,
            error: err,
        };
    }
}

export async function getFfzChannelEmotes(displayName: string): Promise<any> {
    let redisData = await redis.get(`id:${displayName}`);
    let channelId = null;
    if (redisData) {
        channelId = redisData;
    } else {
        const resolvedData = await resolveUser(displayName);
        channelId = resolvedData.user.id;
        redis.set(`id:${displayName}`, channelId);
    }

    let respData = null;
    await axios
        .get(`https://api.frankerfacez.com/v1/room/id/${channelId}`)
        .then((data) => {
            console.log(data.data);

            let emotes = [];
            for (let set in data.data.sets) {
                for (let emote of data.data.sets[set].emoticons) {
                    emotes.push(emote.name);
                }
            }
            respData = emotes.join(' ');
        })
        .catch((err) => {
            respData = null;
        });
    return respData;
}

export async function getBttvChannelEmotes(displayName: string): Promise<any> {
    let redisData = await redis.get(`id:${displayName}`);
    let channelId = null;
    if (redisData) {
        channelId = redisData;
    } else {
        const resolvedData = await resolveUser(displayName);
        channelId = resolvedData.user.id;
        redis.set(`id:${displayName}`, channelId);
    }

    let respData = null;
    await axios
        .get(`https://api.betterttv.net/3/cached/users/twitch/${channelId}`)
        .then((data) => {
            const channelEmotes = data.data.channelEmotes.map((emote: any) => emote.code);
            const sharedEmotes = data.data.sharedEmotes.map((emote: any) => emote.code);
            respData = channelEmotes.concat(sharedEmotes).join(' ');
        })
        .catch((err) => {
            respData = null;
        });
    return respData;
}

export async function getStvChannelEmotes(displayName: string): Promise<any> {
    let respData = null;
    await axios
        .get(`https://api.7tv.app/v2/users/${displayName}/emotes`)
        .then((data) => {
            respData = data.data;
        })
        .catch((err) => {
            respData = null;
        });
    return respData;
}

async function getFfzGlobalEmotes(): Promise<any> {
    let respData = null;
    await axios
        .get(`https://api.frankerfacez.com/v1/set/global`)
        .then((data) => {
            respData = data.data;
        })
        .catch((err) => {
            respData = null;
        });
    return respData;
}

async function getBttvGlobalEmotes(): Promise<any> {
    let respData = null;
    await axios
        .get(`https://api.betterttv.net/3/cached/emotes/global`)
        .then((data) => {
            respData = data.data;
        })
        .catch((err) => {
            respData = null;
        });
    return respData;
}

async function getStvGlobalEmotes(): Promise<any> {
    let respData = null;
    await axios
        .get(`https://api.7tv.app/v2/emotes/global`)
        .then((data) => {
            respData = data.data;
        })
        .catch((err) => {
            respData = null;
        });
    return respData;
}
