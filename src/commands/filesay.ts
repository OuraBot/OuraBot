import axios from 'axios';
import dotenv from 'dotenv';
import { chatClient } from '../index';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getClient } from '../utils/spamClients';

dotenv.config();

class testComand extends Command {
    name = 'filesay';
    description = 'Say a hastebin file';
    usage = 'filesay <url> <optional msg prefix?> <--silent?>';
    aliases = ['ob-filesay', 'ob_filesay'];
    hidden = true;
    requireFastLimits = true;
    permission = 97;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0].match(/^https:\/\/(haste\.zneix\.eu\/raw|mrauro\.dev|hastebin\.com\/raw|pastebin\.com\/raw|(raw|gist).githubusercontent.com)\/.+$/))
            return {
                success: false,
                message: 'Missing RAW haste/pastebin/gist link',
                error: null,
            };

        axios.get(args[0]).then(async (response: any) => {
            let msgs = response.data.split('\n');
            if (msgs.length > 10000)
                return {
                    success: false,
                    message: 'Too many lines to say (max 10k)',
                    error: null,
                };
            let fast = args.includes('--fast');
            let silent = args.includes('--silent');
            if (!silent) await chatClient.say(channel, `@${user}, Filesay ETA: ${msgs.length / 10} seconds`);
            if (fast) {
                for (let i = 0; i < msgs.length; i++) {
                    await getClient().say(channel, msgs[i]);
                }
            } else {
                if (args[1] && args[1] !== '--silent') {
                    for (let msg of msgs) {
                        await chatClient.say(channel, `${args[1]} ${msg}`);
                    }
                } else {
                    for (let msg of msgs) {
                        await chatClient.say(channel, msg);
                    }
                }
                if (!silent) await chatClient.say(channel, `@${user}, Filesay completed!`);
            }
        });

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new testComand();
