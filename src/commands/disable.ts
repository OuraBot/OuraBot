import dotenv from 'dotenv';
import { config, redis } from '../index';
import { Command, CommandReturnClass, getCommands } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'disable';
    description = '[Deprecated] Disable a command for the channel';
    usage = 'disable <command>';
    permission = 39;
    userCooldown = 3;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        return {
            success: true,
            message: `This command is now deprecated. Please use the "command" command to set certain command properties.`,
            error: null,
        };
    };
}

export const cmd = new testComand();
