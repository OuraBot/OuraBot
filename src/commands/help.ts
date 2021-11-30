import dotenv from 'dotenv';
import { config, redis } from '..';
import { Command, CommandReturnClass, commands } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'help';
    description = 'View the help about a given command';
    usage = 'help';
    userCooldown = 5;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: `Missing command name (use ${this.prefix}commands for a list of commands)`,
                error: null,
            };

        let command: Command = commands.get(args[0]);
        if (!command) {
            for (const cmd of commands.values()) {
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

        return {
            success: true,
            message: `${this.prefix}${command.name}${command.aliases?.length > 0 ? ` (${command.aliases.map((a) => `${this.prefix}${a}`).join(', ')})` : ''}: ${command.description} - ${
                command?.userCooldown ? command.userCooldown : 0
            }s user cooldown & ${command?.channelCooldown ? command.channelCooldown : 0}s channel cooldown `,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
