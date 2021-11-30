import { exec } from 'child_process';
import dotenv from 'dotenv';
import { chatClient } from '..';
import { Command, CommandReturnClass, getCommands, refreshCommands } from '../utils/commandClass';
import { safeRestart } from '../utils/taskManager';
dotenv.config();

class suggestCommand extends Command {
    name = 'reload';
    description = 'Reload a command';
    usage = 'reload';
    hidden = true;
    permission = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        chatClient.say(channel, 'dankCircle tsc');
        exec(`tsc`, async (error, stdout, stderr) => {
            if (error) throw error;
            refreshCommands();
            chatClient.say(channel, 'Commands reloaded!');
        });

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
