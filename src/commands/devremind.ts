import dotenv from 'dotenv';
import { chatClient } from '..';
import { Channel } from '../models/channel.model';
import { Reminder } from '../models/reminder.model';
import { resolveUser } from '../utils/apis/ivr';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
dotenv.config();

class remindCommand extends Command {
    name = 'devremind';
    description = 'Remind a user as the system for when they next type in chat';
    usage = 'devremind <user> <message>';
    permission = 1;
    hidden = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let userData = await resolveUser(args[0]);
        console.log(userData);
        if (!userData.success) {
            return {
                success: false,
                message: null,
                error: ErrorEnum.INVALID_USER,
            };
        }

        if (!args[1]) {
            return {
                success: false,
                message: 'Missing message',
                error: null,
            };
        }

        if (userData.user.login === user)
            return {
                success: false,
                message: 'You cannot remind yourself',
                error: null,
            };

        args.shift();
        let reminderMessage = args.join(' ');
        if (reminderMessage.length > 400)
            return {
                success: false,
                message: 'Reminder message too long',
                error: null,
            };

        const newReminder = new Reminder({
            username: userData.user.login,
            message: reminderMessage,
            timestamp: new Date(),
            author: 'SYSTEM REMINDER',
        });

        newReminder.save();

        return {
            success: true,
            message: `I will remind ${userData.user.displayName} as "SYSTEM" when they next type SeemsGood`,
            error: null,
        };
    };
}

export const cmd = new remindCommand();
