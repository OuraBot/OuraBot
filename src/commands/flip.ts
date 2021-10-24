import dotenv from 'dotenv';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'flip';
    description = 'Flip a coin!';
    usage = 'flip';
    userCooldown = 5;
    channelCooldown = 5;
    aliases = ['coinflip'];
    allowCustomPermissions = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        return {
            success: true,
            message: `${Math.random() > 0.5 ? 'Heads' : 'Tails'}!`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
