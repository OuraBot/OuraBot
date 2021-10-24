import dotenv from 'dotenv';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { KNOWN_BOT_LIST } from '../utils/knownBots';
dotenv.config();

class suggestCommand extends Command {
    name = 'knownbot';
    description = 'Check if a specified user is on the known bot list';
    usage = 'knownbot';
    aliases = ['checkbot'];
    userCooldown = 5;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing user to check',
                error: null,
            };
        const targetUser = args[0];
        // check if targetuser is a valid username regeex
        if (!targetUser.match(/^[a-zA-Z0-9_]{3,32}$/))
            return {
                success: false,
                message: 'Invalid username',
                error: null,
            };
        return {
            success: true,
            message: KNOWN_BOT_LIST.has(targetUser) ? `${targetUser} is on the known bot list` : `${targetUser} is not on the known bot list`,
            error: null,
            ignorebanphrase: true,
        };
    };
}

export const cmd = new suggestCommand();
