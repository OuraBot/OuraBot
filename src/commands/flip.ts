import dotenv from 'dotenv';
import { apiClient, chatClient, redis } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'flip';
    description = 'Flip a coin!';
    usage = 'flip';
    userCooldown = 5;
    channelCooldown = 3;
    aliases = ['coinflip'];
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        return {
            success: true,
            message: `${Math.random() > 0.5 ? 'Heads' : 'Tails'}!`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
