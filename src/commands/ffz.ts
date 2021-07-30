import dotenv from 'dotenv';
import { chatClient } from '..';
import { getFfzChannelEmotes } from '../utils/channelEmotes';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { chunkArr } from '../utils/stringManipulation';

dotenv.config();

class testComand extends Command {
    name = 'ffz';
    description = 'Get all FrankerfaceZ emotes for the channel';
    usage = 'ffz';
    channelCooldown = 30;
    userCooldown = 60;
    aliases = ['ffzemotes'];
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let ffzEmotes = await getFfzChannelEmotes(channel.replace('#', ''));
        if (ffzEmotes) {
            ffzEmotes = ffzEmotes.split(' ');
        } else {
            return {
                success: false,
                message: 'No FrankerFaceZ emotes found for this channel',
                error: null,
            };
        }
        let chunkedMsg = chunkArr(ffzEmotes, 450, ' ');
        for (let msg of chunkedMsg) {
            chatClient.say(channel, `FFZ Emotes: ${msg}`);
        }
        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new testComand();
