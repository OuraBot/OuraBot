import dotenv from 'dotenv';
import { commitDate, commitHash, config, redis } from '..';
import { prettyTime } from '../utils/auroMs';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
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
        let dateSinceCommit = prettyTime(new Date().getTime() - new Date(commitDate).getTime(), false);
        let channelPrefix = await redis.get(`ob:${channel}:prefix`);
        if (channelPrefix) {
            channelPrefix = channelPrefix;
        } else {
            channelPrefix = process.env.DEBUG === 'TRUE' ? config.debugprefix : config.prefix;
        }
        return {
            success: true,
            message: `Pong! Serving ${channelList.length} channels for ${prettyTime(Math.round(process.uptime() * 1000))}. ${keys} keys. On commit ${commitHash.substr(
                0,
                7
            )} (${dateSinceCommit} ago). Prefix: ${channelPrefix}`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
