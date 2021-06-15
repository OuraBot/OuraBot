import axios from 'axios';

async function sourceURL(slug: String) {
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

export default sourceURL;
