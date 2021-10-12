import axios from 'axios';
import dotenv from 'dotenv';
import { chatClient } from '../index';
import { Command, CommandReturnClass } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'filesayslow';
    description = 'Say a hastebin file with a 1.1 second delay';
    usage = 'filesayslow <url> <optional msg prefix?> <--silent?>';
    hidden = true;
    permission = 64;
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
            let silent = args[args.length - 1] === '--silent' ? true : false;
            if (!silent) await chatClient.say(channel, `@${user}, Filesay ETA: ${Math.round(msgs.length * 1.2)} seconds`);
            if (args[1] && args[1] !== '--silent') {
                for (let msg of msgs) {
                    await new Promise((resolve) => setTimeout(resolve, 1200));
                    await chatClient.say(channel, `${args[1]} ${msg}`);
                }
            } else {
                for (let msg of msgs) {
                    await new Promise((resolve) => setTimeout(resolve, 1200));
                    await chatClient.say(channel, msg);
                }
            }
            if (!silent) await chatClient.say(channel, `@${user}, Filesayslow completed!`);
        });

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new testComand();
