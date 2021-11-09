import dotenv from 'dotenv';
import { cancelSpamChannels } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'spamstop';
    description = 'Stop an active spam';
    usage = 'spamstop';
    aliases = ['stopspam'];
    userCooldown = 5;
    channelCooldown = 5;
    permission = 931;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        cancelSpamChannels.add(channel);
        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
