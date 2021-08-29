import axios from 'axios';
import * as fs from 'fs';

const banphraseURL =  JSON.parse(fs.readFileSync('./src/banphrases.json').toString());

export async function checkPajbotBanphrase(message: string, channel: string): Promise<Boolean> {
        if (!banphraseURL[channel.replace('#', '')]) return false;

        let resp;
        try {
            resp = await axios.post(banphraseURL[channel.replace('#', '')], {
                message: message
            });
        } catch (err) {
            false;   
        }
        
        console.log(resp.data.banned)

        if (resp.data.banned === true) {
            return true;
        } else {
            return false;
        }
        
}
