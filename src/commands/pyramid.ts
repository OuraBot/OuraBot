import dotenv from 'dotenv';
import { chatClient } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class pyramidCommand extends Command {
    name = 'pyramid';
    description = 'Make a pyramid';
    usage = 'pyramid <width> <emote/text>';
    userCooldown = 15;
    channelCooldown = 10;
    permission = 4;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let width: any = args[0];
        args.shift();
        let emote = args.join(' ') + ' ';

        if (!width || !emote)
            return {
                success: false,
                message: 'Missing width or emote/text',
                error: null,
            };

        width = parseInt(width);
        if (isNaN(width)) {
            return {
                success: false,
                message: 'Provided width is not a number',
                error: null,
            };
        }

        if (width < 2 || width > 10)
            return {
                success: false,
                message: 'Width must be between 2 and 10',
                error: null,
            };

        if (emote.length * width > 490)
            return {
                success: false,
                message: 'Emote/text is too long for the given width',
                error: null,
            };

        // first half
        for (let i = 0; i < width; i++) {
            chatClient.say(channel, emote.repeat(i + 1));
        }

        // second half
        for (let i = width; i > 0; i--) {
            if (i != width) chatClient.say(channel, emote.repeat(i));
        }

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new pyramidCommand();
