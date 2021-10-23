import dotenv from 'dotenv';
import { cancelFilesayChannels } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'filesaystop';
    description = 'Stop an active filesay';
    usage = 'filesaystop';
    userCooldown = 5;
    channelCooldown = 5;
    permission = 931;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        cancelFilesayChannels.add(channel);
        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
