import dotenv from 'dotenv';
import { redis } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'setprefix';
    description = 'Set the channel prefix for the bot';
    usage = 'setprefix <prefix>';
    userCooldown = 5;
    channelCooldown = 5;
    permission = 39;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing prefix',
                error: null,
            };

        const prefix = args[0];
        if (prefix.length > 5)
            return {
                success: false,
                message: 'Prefix is too long',
                error: null,
            };

        redis.set(`ob:${channel}:prefix`, prefix);
        return {
            success: true,
            message: `Prefix set to ${prefix}`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
