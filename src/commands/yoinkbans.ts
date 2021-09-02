import axios from 'axios';
import dotenv from 'dotenv';
import { upload } from '../utils/apis/haste';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'yoinkbans';
    description = 'Yoink bans from a channel';
    usage = 'yoinkbans <#channel>';
    hidden = true;
    permission = 4;
    userCooldown = 5;
    channelCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing channel',
                error: null,
            };

        let channelName = args[0].replace('#', '').replace('@', '').replace(',', '');
        let recentMessages = (await axios.get(`https://recent-messages.robotty.de/api/v2/recent-messages/${channelName}?clearchat_to_notice=true`)).data.messages;

        let bans: string[] = [];
        let i = 0;
        for (let msg of recentMessages) {
            if (msg.match(/^@.+\s:tmi.twitch.tv\sNOTICE\s#[A-z0-9]+\s:.+has\sbeen\spermanently\sbanned\.$/)) {
                let ban = msg.replace(/^@.+\s:tmi.twitch.tv\sNOTICE\s#[A-z0-9]+\s:|\shas\sbeen\spermanently\sbanned.+$/g, '');
                bans.push(ban);
                i++;
                console.log(ban, i);
            }
        }

        if (bans.length === 0)
            return {
                success: false,
                message: 'No bans found in the specified channel.',
                error: null,
            };

        let hasteURL = await upload(bans.join('\n'));

        return {
            success: true,
            message: `Yoinked ${bans.length} bans from ${obfuscateName(channelName)} - ${hasteURL}`,
            error: null,
            ignorebanphrase: true,
        };
    };
}

export const cmd = new suggestCommand();
