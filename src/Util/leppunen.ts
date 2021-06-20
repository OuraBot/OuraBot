import axios from 'axios';
import Redis from 'ioredis';

const redis = new Redis();

export async function sourceURL(slug: String) {
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
                error: `Not real clip`,
            };

        const [matchedSlug] = match;
        console.log(matchedSlug);
        let data = await axios.get(`https://api.ivr.fi/v2/twitch/getClip/${matchedSlug}`);
        console.log(data.data);

        const source = Object.entries(data.data.clip.videoQualities).sort((a, b) => Number(a['quality']) - Number(b['quality']))[0][1];

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

export async function getUserInfo(displayName: string) {
    try {
        let cacheEntry = await redis.get(`getUserInfo:${displayName}`);

        if (cacheEntry) {
            return {
                data: JSON.parse(cacheEntry),
                cached: true,
                error: null,
            };
        } else {
            let data = await axios.get(`https://api.ivr.fi/twitch/resolve/${displayName.replace('@', '')}`);
            let prettyData = {
                banned: data.data.banned,
                displayName: data.data.displayName,
                login: data.data.login,
                id: data.data.id,
                bio: data.data.bio,
                chatColor: data.data.chatColor,
                logo: data.data.logo,
                partner: data.data.partner,
                affiliate: data.data.affiliate,
                bot: data.data.bot,
                createdAt: data.data.createdAt,
                updatedAt: data.data.updatedAt,
                chatSettings: {
                    chatDelayMs: data.data.chatSettings.chatDelayMs,
                    followersOnly: data.data.chatSettings.followersOnlyDurationMinutes,
                    blockLinks: data.data.chatSettings.blockLinks,
                    subOnly: data.data.chatSettings.isSubscriberOnlyModeEnabled,
                    emoteOnly: data.data.chatSettings.isEmoteOnlyModeEnabled,
                    slowMode: data.data.chatSettings.slowModeDurationSeconds,
                    fastSubsMode: data.data.chatSettings.isFastSubsModeEnabled,
                    r9k: data.data.chatSettings.isUniqueChatModeEnabled,
                    requireVerifiedAccount: data.data.chatSettings.requireVerifiedAccount,
                    rules: data.data.chatSettings.rules,
                },
                roles: {
                    isAffiliate: data.data.roles.isAffiliate,
                    isPartner: data.data.roles.isPartner,
                    isSiteAdmin: data.data.roles.isSiteAdmin,
                    isStaff: data.data.roles.isStaff,
                },
            };

            redis.set(`getUserInfo:${displayName}`, JSON.stringify(prettyData), 'EX', 1800);
            return {
                data: prettyData,
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

export async function isUserBot(displayName: string) {
    try {
        let cacheEntry = await redis.get(`isUserBot:${displayName}`);

        if (cacheEntry) {
            return {
                data: JSON.parse(cacheEntry),
                cached: true,
                error: null,
            };
        } else {
            let data = await axios.get(`https://api.ivr.fi/twitch/bot/${displayName.replace('@', '')}`);
            let prettyData = {
                display_name: data.data.display_name,
                id: data.data.id,
                known: data.data.known,
                verified: data.data.verified,
            };
            redis.set(`isUserBot:${displayName}`, JSON.stringify(prettyData), 'EX', 3600);
            return {
                data: prettyData,
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

export async function getEmote(emote: string) {
    try {
        let cacheEntry = await redis.get(`getEmote:${emote}`);

        if (cacheEntry) {
            return {
                data: JSON.parse(cacheEntry),
                cached: true,
                error: null,
            };
        } else {
            let data = await axios.get(`https://api.ivr.fi/twitch/emotes/${emote}`);
            let prettyData = {
                channel: data.data.channel,
                channelLogin: data.data.channellogin,
                id: data.data.channelid,
                emoteId: data.data.emoteid,
                emoteCode: data.data.emotecode,
                emoteUrls: {
                    emoteUrl_1x: data.data.emoteurl_1x,
                    emoteUrl_2x: data.data.emoteurl_2x,
                    emoteUrl_3x: data.data.emoteurl_3x,
                },
                setId: data.data.setid,
                tier: data.data.tier,
            };
            redis.set(`getEmote:${emote}`, JSON.stringify(prettyData), 'EX', 3600);
            return {
                data: prettyData,
                cached: false,
                error: null,
            };
        }
    } catch (err) {
        return {
            data: null,
            cached: null,
        };
    }
}
