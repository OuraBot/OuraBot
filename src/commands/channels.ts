import dotenv from 'dotenv';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { chunkArr, obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'channels';
    description = 'Get all the channels OuraBot is in';
    usage = 'channels';
    permission = 97;
    requireFastLimits = true;
    userCooldown = 30;
    channelCooldown = 60;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let channels = await getChannels(process.env.CLIENT_USERNAME);
        channels = channels.map((channel) => obfuscateName(channel));
        let chunkedChannels = chunkArr(channels, 400, ' ');

        return {
            success: true,
            message: chunkedChannels.map((chunk) => `I am in: ${chunk}`),
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
