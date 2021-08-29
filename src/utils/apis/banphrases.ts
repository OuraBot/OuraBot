import axios from 'axios';
import * as fs from 'fs';

const banphraseURL =  JSON.parse(fs.readFileSync('./src/banphrases.json').toString());
// hmmm
export async function checkPajbot(message: string, channel: string): Promise<Boolean> {
    console.log(banphraseURL)
    console.log(banphraseURL[channel.replace('#', '')])

        if(!banphraseURL[channel.replace('#', '')]) return false;

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
        }
        else {
            return false;
        }
        
}
