import axios from 'axios';
import * as fs from 'fs';
import Redis from 'ioredis';

const redis = new Redis();

async function getBestEmote(displayName: String, emoteOptions: String[], fallbackEmote: String) {
    try {
        const t0 = process.hrtime();
        let emoteData = await getAllEmotes(displayName);
        const t1 = process.hrtime();

        let availableEmote: String = null;

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

        /*
        fs.writeFile('emotes.txt', allEmotes.join(' '), function (err) {
            console.error(err);
        });
        */

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

async function getAllEmotes(displayName: String) {
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

            if (stvGlobalResp != null) {
                // Loop through each emote
                for (let emote of stvGlobalResp) {
                    allEmotes.push(emote.name);
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

async function getFfzChannelEmotes(displayName: String) {
    let respData = null;
    await axios
        .get(`https://customapi.aidenwallis.co.uk/api/v1/emotes/${displayName}/ffz`)
        .then((data) => {
            respData = data.data;
        })
        .catch((err) => {
            respData = null;
        });
    return respData;
}

async function getBttvChannelEmotes(displayName: String) {
    let respData = null;
    await axios
        .get(`https://customapi.aidenwallis.co.uk/api/v1/emotes/${displayName}/bttv`)
        .then((data) => {
            respData = data.data;
        })
        .catch((err) => {
            respData = null;
        });
    return respData;
}

async function getStvChannelEmotes(displayName: String) {
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

async function getFfzGlobalEmotes() {
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

async function getBttvGlobalEmotes() {
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

async function getStvGlobalEmotes() {
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

export default getBestEmote;
