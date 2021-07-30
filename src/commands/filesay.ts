import dotenv from 'dotenv';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { ChatClient } from 'twitch-chat-client';
import { chatClient } from '../index';
import axios from 'axios';

dotenv.config();

class testComand extends Command {
    name = 'filesay';
    description = 'Say a hastebin file';
    usage = 'filesayfast <url> <optional msg prefix?>';
    hidden = true;
    permission = 1;
    aliases = ['filesayfast'];
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0].match(/^https:\/\/(haste\.zneix\.eu\/|hastebin\.com\/|pastebin\.com\/)raw\/.+$/))
            return {
                success: false,
                message: 'Missing RAW haste/pastebin link',
                error: null,
            };

        axios.get(args[0]).then(async (response: any) => {
            let msgs = response.data.split('\n');
            if (args[1]) {
                for (let msg of msgs) {
                    await chatClient.say(channel, `${args[1]} ${msg}`);
                }
            } else {
                for (let msg of msgs) {
                    await chatClient.say(channel, msg);
                }
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
