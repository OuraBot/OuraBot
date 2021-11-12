import dotenv from 'dotenv';
import { banphraseCheck, redis } from '../index';
import { Status, getUserAfk, clearUserAfk, setUserAfk, resumeUserAfk } from '../utils/afkManager';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'rafk';
    description = 'Resume your AFK status (5 minutes max)';
    usage = 'rafk';
    userCooldown = 30;
    execute = async (user: string, channel: string, args: string[], cmdMsg: string): Promise<CommandReturnClass> => {
        let afk = await getUserAfk(user);
        if (afk)
            return {
                success: true,
                message: 'You are already marked as AFK!',
                error: null,
            };

        let resumedAfk = await resumeUserAfk(user);
        if (resumedAfk) {
            return {
                success: true,
                message: 'Your AFK status has been resumed',
                error: null,
            };
        } else {
            return {
                success: true,
                message: 'You cannot resumve your AFK status because it ended more than 5 minutes ago',
                error: null,
            };
        }
    };
}

export const cmd = new suggestCommand();
