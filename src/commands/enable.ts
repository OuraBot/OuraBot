import dotenv from 'dotenv';
import { config, redis } from '../index';
import { Command, CommandReturnClass, getCommands } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'enable';
    description = '[Deprecated] Enable a command for the channel';
    usage = 'enable <command>';
    permission = 39;
    userCooldown = 10;
    channelCooldown = 10;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        return {
            success: true,
            message: `Please use the "command" command to set certain command properties. (Do "${this.prefix}command <command> enabled true")`,
            error: null,
        };
    };
}

export const cmd = new testComand();
