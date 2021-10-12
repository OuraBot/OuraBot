import axios from 'axios';
import { redis } from '../..';

export class PajbotApi {
    channel: string;
    url: string;
}

export async function checkPajbotBanphrase(message: string, channel: string): Promise<Boolean> {
    const banphraseURL = JSON.parse(await redis.get(`ob:pajbotbanphrase`));
    if (!banphraseURL.map((e: PajbotApi) => e.channel).includes(channel.replace('#', ''))) return false;
    let obj = banphraseURL.filter((e: PajbotApi) => e.channel === channel.replace('#', ''));

    let resp;
    try {
        resp = await axios.post(`${obj[0].url.replace('/api/v1/banphrases/test', '')}/api/v1/banphrases/test`, {
            message: message,
        });
    } catch (err) {
        return false;
    }

    if (resp.data.banned === true) {
        return true;
    } else {
        return false;
    }
}
