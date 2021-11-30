import dotenv from 'dotenv';
import { config, redis } from '..';
import { Command, CommandReturnClass, commands } from '../utils/commandClass';
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

        let command: Command = commands.get(args[0]);
        if (!command) {
            for (const cmd of commands.values()) {
                if (cmd.aliases.includes(args[0])) {
                    command = cmd;
                    break;
                }

                if (cmd === commands.values().next().value)
                    return {
                        success: false,
                        message: 'Command not found',
                        error: null,
                    };
            }
        }

        return {
            success: true,
            message: `${this.prefix}${command.usage}`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
