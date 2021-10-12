import dotenv from 'dotenv';
import { commands, config, redis } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'usage';
    description = 'View the usage about a given command';
    usage = 'usage';
    userCooldown = 5;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing command name',
                error: null,
            };

        let command: Command = (await commands).get(args[0]);
        if (!command) {
            for (const cmd of (await commands).values()) {
                if (cmd.aliases.includes(args[0])) {
                    command = cmd;
                    break;
                }

                if (cmd === (await commands).values().next().value)
                    return {
                        success: false,
                        message: 'Command not found',
                        error: null,
                    };
            }
        }

        let channelPrefix = await redis.get(`ob:${channel}:prefix`);
        if (channelPrefix) {
            channelPrefix = channelPrefix;
        } else {
            channelPrefix = process.env.DEBUG === 'TRUE' ? config.debugprefix : config.prefix;
        }

        return {
            success: true,
            message: `${channelPrefix}${command.usage}`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
