import dotenv from 'dotenv';
import { redis } from '..';
import { Reminder } from '../models/reminder.model';
import { resolveUser } from '../utils/apis/ivr';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class remindCommand extends Command {
    name = 'unremind';
    description = 'Unremind the latest reminder you have set';
    usage = 'unremind';
    userCooldown = 10;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        const reminder = await Reminder.findOne({ author: user }).sort({ createdAt: -1 });
        if (!reminder)
            return {
                success: false,
                message: 'You have no active reminders set',
                error: null,
            };

        await reminder.remove();
        return {
            success: true,
            message: `Reminder removed for user ${obfuscateName(`${reminder.username}`)}`,
            error: null,
        };
    };
}

export const cmd = new remindCommand();
