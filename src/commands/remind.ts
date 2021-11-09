import dotenv from 'dotenv';
import { redis } from '..';
import { Reminder } from '../models/reminder.model';
import { resolveUser } from '../utils/apis/ivr';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
dotenv.config();

class remindCommand extends Command {
    name = 'remind';
    description = 'Remind a user for when they next type in chat';
    usage = 'remind <user> <message>';
    userCooldown = 10;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing user',
                error: null,
            };

        if (args[0] == 'in')
            return {
                success: false,
                message: "FailFish I can't set timed reminders",
                error: null,
            };

        let userData = await resolveUser(args[0]);
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

        if (userData.user.login === 'oura_bot') {
            return {
                success: false,
                message: "FailFish You can't remind me. I'm right here.",
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
            author: user,
        });

        newReminder.save();
        redis.del(`tl:${channel}:reminders`);

        return {
            success: true,
            message: `I will remind ${userData.user.displayName} when they next type SeemsGood`,
            error: null,
        };
    };
}

export const cmd = new remindCommand();
