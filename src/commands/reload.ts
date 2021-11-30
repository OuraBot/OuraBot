import { exec } from 'child_process';
import dotenv from 'dotenv';
import { chatClient } from '..';
import { Command, CommandReturnClass, getCommands, refreshCommands } from '../utils/commandClass';
import { safeRestart } from '../utils/taskManager';
dotenv.config();

class suggestCommand extends Command {
    name = 'reload';
    description = 'Reload a command';
    usage = 'reload <--no-git?>';
    hidden = true;
    permission = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (args.includes('--no-git')) {
            chatClient.say(channel, 'dankCircle tsc');
            exec(`tsc`, async (error, stdout, stderr) => {
                if (error) throw error;
                refreshCommands();
                chatClient.say(channel, 'Commands reloaded!');
            });
        } else {
            chatClient.say(channel, 'dankCircle git pull origin');
            exec(`git pull origin`, async (error, stdout, stderr) => {
                if (error) throw error;

                if (stderr) {
                    if (stderr.includes('Already up to date')) {
                        chatClient.say(channel, 'Already up to date! FailFish');
                    } else {
                        chatClient.say(channel, 'BroBalt Fetched new changes');
                        chatClient.say(channel, 'dankCircle tsc');
                        exec(`tsc`, async (error, stdout, stderr) => {
                            if (error) throw error;
                            refreshCommands();
                            chatClient.say(channel, 'Commands reloaded!');
                        });
                    }
                } else if (stdout) {
                    if (stdout.includes('Already up to date')) {
                        chatClient.say(channel, stdout);
                    } else {
                        chatClient.say(channel, 'BroBalt Fetched new changes');
                        chatClient.say(channel, 'dankCircle tsc');
                        exec(`tsc`, async (error, stdout, stderr) => {
                            if (error) throw error;
                            refreshCommands();
                            chatClient.say(channel, 'Commands reloaded!');
                        });
                    }
                } else {
                    throw new Error(error + stdout + stderr);
                }
            });
        }
        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
