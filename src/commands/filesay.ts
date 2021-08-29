import dotenv from 'dotenv';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { ChatClient } from 'twitch-chat-client';
import { chatClient } from '../index';
import axios from 'axios';
import { prettyTime } from '../utils/auroMs';

dotenv.config();

class testComand extends Command {
    name = 'filesay';
    description = 'Say a hastebin file';
    usage = 'filesayfast <url> <optional msg prefix?> <--silent?>';
    hidden = true;
    permission = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0].match(/^https:\/\/(haste\.zneix\.eu\/|hastebin\.com\/|pastebin\.com\/)raw\/.+$/))
            return {
                success: false,
                message: 'Missing RAW haste/pastebin link',
                error: null,
            };

        axios.get(args[0]).then(async (response: any) => {
            let msgs = response.data.split('\n');
            let silent = args[args.length - 1] === '--silent' ? true : false;
            if (!silent) await chatClient.say(channel, `@${user}, Filesay ETA: ${msgs.length / 10} seconds`);
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
        });

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new testComand();
