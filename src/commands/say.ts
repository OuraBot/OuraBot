import dotenv from 'dotenv';
import { chatClient } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'say';
    description = 'Say a message';
    usage = 'say <#channel?> <message>';
    hidden = true;
    permission = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        // check if the first argument is a channel
        if (args[0].startsWith('#')) {
            let _channel = args[0];
            args.shift();
            chatClient.say(_channel, args.join(' '));
        } else {
            chatClient.say(channel, args.join(' '));
        }

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
