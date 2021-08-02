import dotenv from 'dotenv';
import { chatClient, redis } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
dotenv.config();

class suggestCommand extends Command {
    name = 'set';
    description = 'Set certain values within the bot: counter';
    usage = 'set <key> <value> <subvalue?>';
    userCooldown = 5;
    channelCooldown = 5;
    permission = 4;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (args[0] === 'counter') {
            if (!args[1])
                return {
                    success: false,
                    message: 'Missing counter key',
                    error: null,
                };

            if (!args[2])
                return {
                    success: false,
                    message: 'Missing counter value',
                    error: null,
                };

            let key = args[1];
            if (!key.match(/^[A-z]{4,10}$/))
                return {
                    success: false,
                    message: 'Invalid counter key',
                    error: null,
                };

            let value = Number(args[2]);
            if (isNaN(value))
                return {
                    success: false,
                    message: 'Invalid counter value',
                    error: null,
                };

            // check if value is obsurdly high or low
            if (value > 1000000 || value < -1000000)
                return {
                    success: false,
                    message: 'Counter value is too high or too low',
                    error: null,
                };

            let redisData = await redis.get(`COUNT:${channel}:${key}`);
            if (redisData) {
                await redis.set(`COUNT:${channel}:${key}`, value);
                return {
                    success: true,
                    message: `Counter "${key}" set to ${value}`,
                    error: null,
                };
            } else {
                return {
                    success: false,
                    message: 'Counter key not found (key must exist before setting value!)',
                    error: null,
                };
            }
        } else {
            return {
                success: false,
                message: 'Invalid subargument',
                error: null,
            };
        }
    };
}

export const cmd = new suggestCommand();
