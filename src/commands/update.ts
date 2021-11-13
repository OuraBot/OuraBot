import { exec } from 'child_process';
import dotenv from 'dotenv';
import { chatClient } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { safeRestart } from '../utils/taskManager';
dotenv.config();

class suggestCommand extends Command {
    name = 'update';
    description = 'Update the bot safely';
    usage = 'update';
    hidden = true;
    permission = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        exec(`git pull origin`, async (error, stdout, stderr) => {
            if (error) throw error;

            if (stderr) {
                if (stderr.includes('Already up to date')) {
                    chatClient.say(channel, 'Already up to date! FailFish');
                } else {
                    await exec(`yarn install`);
                    await chatClient.say(channel, 'peepoSad 👋 Restarting');
                    safeRestart();
                }
            } else if (stdout) {
                if (stdout.includes('Already up to date')) {
                    chatClient.say(channel, stdout);
                } else {
                    await exec(`yarn install`);
                    await chatClient.say(channel, 'peepoSad 👋 Restarting');
                    safeRestart();
                }
            } else {
                throw new Error(error + stdout + stderr);
            }
        });

        // safeRestart();

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
