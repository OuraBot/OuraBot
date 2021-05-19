import axios from 'axios';

async function sourceURL(slug: String) {
    try {
        let newSlug = slug.replace(/[ \t󠀀]+$/, '').match(/[a-zA-z]+-[a-zA-z0-9]+$/)?.[0];
        if (!newSlug) return { realClip: false, qualities: [], error: 'Not real clip' };

        let data = await axios.get(`https://api.ivr.fi/twitch/clip/${newSlug}`);

        const source = Object.entries(data.data.response.videoQualities).sort((a, b) => Number(a['quality']) - Number(b['quality']))[0][1];

        data.data.response.videoQualities.push(source);

        return {
            realClip: true,
            qualities: data.data.response.videoQualities,
            error: null,
        };
    } catch (err) {
        return {
            realClip: false,
            qualities: [],
            error: err,
        };
    }
}

export default sourceURL;
