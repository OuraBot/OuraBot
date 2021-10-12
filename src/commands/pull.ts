import { exec } from 'child_process';
import dotenv from 'dotenv';
import { chatClient } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'pull';
    description = 'Pull from Github';
    usage = 'pull';
    hidden = true;
    permission = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        exec(`git pull origin`, async (error, stdout, stderr) => {
            if (error) chatClient.say(channel, `Error: "${error.message}`);
            if (stderr) chatClient.say(channel, `VisLaud 👉 ${stderr.replace('https://github.com/OuraBot/Twitch-Bot', 'OuraBot/Twitch-Bot')}`);
            if (stderr) {
                if (stderr.includes('Already up to date')) {
                } else {
                    await chatClient.say(channel, 'peepoSad 👋 process.exit();');
                    process.exit();
                }
            } else if (stdout) {
                if (stdout.includes('Already up to date')) {
                    chatClient.say(channel, stdout);
                } else {
                    await chatClient.say(channel, 'peepoSad 👋 process.exit();');
                    process.exit();
                }
            } else {
                throw new Error(error + stdout + stderr);
            }
        });

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
