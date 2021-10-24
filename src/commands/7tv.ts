import dotenv from 'dotenv';
import { chatClient } from '..';
import { getStvChannelEmotes } from '../utils/channelEmotes';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { chunkArr } from '../utils/stringManipulation';

dotenv.config();

class testComand extends Command {
    name = '7tv';
    description = 'Get all 7TV emotes for the channel';
    usage = '7tv';
    userCooldown = 60;
    channelCooldown = 30;
    requireFastLimits = true;
    aliases = ['7tvemotes'];
    allowCustomPermissions = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let stvEmotes = await getStvChannelEmotes(channel.replace('#', ''));
        if (stvEmotes) {
            stvEmotes = stvEmotes.map((e: any) => e.name);
        } else {
            return {
                success: false,
                message: 'No 7TV emotes found for this channel',
                error: null,
            };
        }
        let chunkedMsg = chunkArr(stvEmotes, 450, ' ');
        for (let msg of chunkedMsg) {
            chatClient.say(channel, `7TV Emotes: ${msg}`);
        }
        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new testComand();
