import dotenv from 'dotenv';
import { chatClient } from '..';
import { getBttvChannelEmotes } from '../utils/channelEmotes';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { chunkArr } from '../utils/stringManipulation';

dotenv.config();

class testComand extends Command {
    name = 'bttv';
    description = 'Get all BetterTTV emotes for the channel';
    usage = 'bttv';
    userCooldown = 60;
    channelCooldown = 30;
    requireFastLimits = true;
    aliases = ['bttvemotes'];
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let bttvEmotes = await getBttvChannelEmotes(channel.replace('#', ''));
        if (bttvEmotes) {
            bttvEmotes = bttvEmotes.split(' ');
        } else {
            return {
                success: false,
                message: 'No BTTV emotes found for this channel',
                error: null,
            };
        }
        let chunkedMsg = chunkArr(bttvEmotes, 450, ' ');
        for (let msg of chunkedMsg) {
            chatClient.say(channel, `BTTV Emotes: ${msg}`);
        }
        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new testComand();
