import dotenv from 'dotenv';
import { getAllEmotes } from '../utils/channelEmotes';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { chunkArr } from '../utils/stringManipulation';

dotenv.config();

class testComand extends Command {
    name = '3rdpartyemotes';
    description = 'Get all 3rd party emotes for the channel';
    usage = '3rdpartyemotes';
    channelCooldown = 60;
    userCooldown = 120;
    requireFastLimits = true;
    aliases = ['allemotes'];
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let allEmotes = await getAllEmotes(channel.replace('#', ''));

        let emotes = allEmotes.data.sort((a: string, b: string) => {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        });

        let chunkedEmotes = chunkArr(emotes, 480, ' ').map((chunk) => `Emotes: ${chunk}`);

        return {
            success: true,
            message: chunkedEmotes.length >= 1 ? chunkedEmotes : 'This channel has no emotes',
            error: null,
            ignorebanphrase: true,
        };
    };
}

export const cmd = new testComand();
