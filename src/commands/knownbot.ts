import dotenv from 'dotenv';
import { KNOWN_BOT_LIST } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'knownbot';
    description = 'Check if a specified user is on a bot list';
    usage = 'knownbot';
    permission = 32;
    hidden = true;
    userCooldown = 1;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        const targetUser = args[0];
        return {
            success: true,
            message: KNOWN_BOT_LIST.has(targetUser) ? `${targetUser} is on the bot list` : `${targetUser} is not on the bot list`,
            error: null,
            ignorebanphrase: true,
        };
    };
}

export const cmd = new suggestCommand();
