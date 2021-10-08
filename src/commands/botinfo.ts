import dotenv from 'dotenv';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'botinfo';
    description = 'Get detailed information about the bot.';
    usage = 'botinfo';
    aliases = ['ourabot', 'info', 'whoareyou', 'oura_bot'];
    userCooldown = 10;
    channelCooldown = 10;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        return {
            success: true,
            message: `You can view information about me here 👉 https://ourabot.github.io/info/`,
            error: null,
            ignorebanphrase: true,
        };
    };
}

export const cmd = new suggestCommand();
