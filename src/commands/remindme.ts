import dotenv from 'dotenv';
import { redis } from '..';
import { Reminder } from '../models/reminder.model';
import { resolveUser } from '../utils/apis/ivr';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
import * as chrono from 'chrono-node';
import { addTimedReminder } from '../utils/timedReminders';
import prettyMs from 'pretty-ms';
dotenv.config();

class remindCommand extends Command {
    name = 'remindme';
    description = 'Remind yourself in a given amount of time with a given mesage';
    usage = 'remindme <message> (in/on) <time (use full unit names instead of abbreviated ones (minutes instead of m, etc))>';
    userCooldown = 10;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing reminder message',
                error: null,
            };

        if (!args[1])
            return {
                success: false,
                message: 'Missing time to remind you in',
                error: null,
            };

        if (!args[2])
            return {
                success: false,
                message: 'Missing time to remind you in',
                error: null,
            };

        const time = chrono.parse(args.join(' '), new Date(new Date().getTime() + 1000), {
            forwardDate: true,
        });

        if (!time || !time[0])
            return {
                success: false,
                message: 'Invalid time',
                error: null,
            };

        let message = args
            .join(' ')
            .replace(time[time.length - 1].text, '')
            .replace(/(on|in)\s$/, '');

        if (message.length == 0) message = '(no message provided)';

        const timeInMs = time[time.length - 1].start.date().getTime() - Date.now();

        if (timeInMs === null || timeInMs === undefined || timeInMs === 0 || isNaN(timeInMs))
            return {
                success: false,
                message: 'Invalid time',
                error: null,
            };

        if (timeInMs < 0)
            return {
                success: false,
                message: "Unless you have a time machine I can borrow, I can't remind you for that time (negative time!)",
                error: null,
            };

        if (timeInMs > 1000 * 60 * 60 * 24 * 365)
            return {
                success: false,
                message: "I can't remind you for that long",
                error: null,
            };

        const reminderTimestamp = Date.now() + timeInMs;

        addTimedReminder(message, user, reminderTimestamp, channel);

        return {
            success: true,
            message: `I will remind you in ${prettyMs(timeInMs, {
                secondsDecimalDigits: 0,
            })}`,
            error: null,
        };
    };
}

export const cmd = new remindCommand();
