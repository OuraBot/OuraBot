import dotenv from 'dotenv';
import { chatClient, redis } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
dotenv.config();

class suggestCommand extends Command {
    name = 'subs';
    description = 'View how many subs ELPWS needs for the Walmart Furry Stream';
    usage = 'subs';
    userCooldown = 1;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let aaa = await redis.get(`elpwssubcount`);
        return {
            success: true,
            message: `pepeLaugh ${aaa}/250 subs`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
