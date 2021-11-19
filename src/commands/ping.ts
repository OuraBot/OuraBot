import dotenv from 'dotenv';
import prettyMilliseconds from 'pretty-ms';
import { commitDate, commitHash, config, redis } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
dotenv.config();

class suggestCommand extends Command {
    name = 'ping';
    description = 'Pong! View information about the bot.';
    usage = 'ping';
    userCooldown = 5;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let channelList = await getChannels(process.env.CLIENT_USERNAME);
        let keys = await redis.dbsize();
        let dateSinceCommit = prettyMilliseconds(new Date().getTime() - new Date(commitDate).getTime(), {
            secondsDecimalDigits: 0,
        });

        return {
            success: true,
            message: `Pong! Serving ${channelList.length} channels for ${prettyMilliseconds(Math.round(process.uptime() * 1000), {
                secondsDecimalDigits: 0,
            })}. ${keys} keys. On commit ${commitHash.substr(0, 7)} (${dateSinceCommit} ago). Prefix: ${this.prefix}`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
