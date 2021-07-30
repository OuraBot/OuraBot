import dotenv from 'dotenv';
import { chatClient, redis } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
dotenv.config();

class suggestCommand extends Command {
    name = 'ping';
    description = 'Pong! View information about the bot.';
    usage = 'ping';
    userCooldown = 1;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let channelList = await getChannels(process.env.CLIENT_USERNAME);
        let keys = await redis.dbsize();
        return {
            success: true,
            message: `Pong! Serving ${channelList.length} channels for ${prettyTime(Math.round(process.uptime() * 1000))}. ${keys} keys`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
