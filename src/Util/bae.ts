import axios from 'axios';
import * as fs from 'fs';

async function getBestEmote(displayName: String, emoteOptions: String[], fallbackEmote: String) {
    try {
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

        // Loop through each emote (split by spaces because Aiden's api returns a space seperated string)
        for (let emote of ffzChannelResp.split(' ')) {
            allEmotes.push(emote);
        }

        // Loop through each emote (split by spaces because Aiden's api returns a space seperated string)
        for (let emote of bttvChannelResp.split(' ')) {
            allEmotes.push(emote);
        }

        // Loop through each emote
        for (let emote of stvChannelResp) {
            allEmotes.push(emote.name);
        }

        // Navigate to the 3rd emote set and the emoticons and loop through
        for (let emote of ffzGlobalResp.sets['3'].emoticons) {
            allEmotes.push(emote.name);
        }

        // Loop through each emote
        for (let emote of bttvGlobalResp) {
            allEmotes.push(emote.code);
        }

        // Loop through each emote
        for (let emote of stvGlobalResp) {
            allEmotes.push(emote.name);
        }

        let availableEmote: String = null;

        for (let preferredEmote of emoteOptions) {
            if (availableEmote != null) break;
            for (let emote of allEmotes) {
                console.log(`Checking if ${emote} matches ${preferredEmote}...`);
                if (emote == preferredEmote) {
                    availableEmote = emote;
                    console.log('Match found!');
                    break;
                }
            }
        }

        // If the available emote is null, that means we don't have a pick and we fallbback to the fallback emote
        if (availableEmote == null) availableEmote = fallbackEmote;

        // -- Used for testing --
        /*
        fs.writeFile('emotes.txt', allEmotes.join(' '), function (err) {
            console.error(err);
        });
        */

        return {
            allEmotes: allEmotes,
            bestAvailableEmote: availableEmote,
            error: null,
        };
    } catch (err) {
        return {
            allEmotes: null,
            bestAvailableEmote: null,
            error: err,
        };
    }
}

async function getFfzChannelEmotes(displayName: String) {
    return (await axios.get(`https://customapi.aidenwallis.co.uk/api/v1/emotes/${displayName}/ffz`)).data;
}

async function getBttvChannelEmotes(displayName: String) {
    return (await axios.get(`https://customapi.aidenwallis.co.uk/api/v1/emotes/${displayName}/bttv`)).data;
}

async function getStvChannelEmotes(displayName: String) {
    return (await axios.get(`https://api.7tv.app/v2/users/${displayName}/emotes`)).data;
}

async function getFfzGlobalEmotes() {
    return (await axios.get(`https://api.frankerfacez.com/v1/set/global`)).data;
}

async function getBttvGlobalEmotes() {
    return (await axios.get(`https://api.betterttv.net/3/cached/emotes/global`)).data;
}

async function getStvGlobalEmotes() {
    return (await axios.get(`https://api.7tv.app/v2/emotes/global`)).data;
}

export default getBestEmote;
