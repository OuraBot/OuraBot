import dotenv from 'dotenv';
import { chatClient, nukeMessages } from '..';
import { ErrorModel, IError } from '../models/error.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'checknuke';
    description = 'Returns the size of nukeMessages';
    permission = 32;
    hidden = true;
    usage = 'checknuke';
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        const size = JSON.stringify(nukeMessages).replace(/[\[\]\,\"]/g, '').length;
        // convert bytes to KB
        const sizeKB = Math.round(size / 1024);
        return {
            success: true,
            message: `nukeMessages is ${sizeKB}kb with a length of ${nukeMessages.length}`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
