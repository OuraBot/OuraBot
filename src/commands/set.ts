import dotenv from 'dotenv';
import { chatClient, redis, sevenTVSource } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
dotenv.config();

class suggestCommand extends Command {
    name = 'set';
    description = 'Set certain values within the bot: counter, 7tv';
    extendedDescription = `counter (number): Counter variables for custom commands | 7tv: Whether you want newly added 7TV emotes to be posted to chat`;
    usage = 'set <target> <value> <subvalue?>';
    userCooldown = 5;
    channelCooldown = 5;
    permission = 4;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (args[0] === 'counter') {
            if (!args[1])
                return {
                    success: false,
                    message: 'Missing counter target',
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
        } else if (args[0] === '7tv') {
            if (!args[1])
                return {
                    success: false,
                    message: 'Missing 7tv value (true/false)',
                    error: null,
                };

            if (args[1] === 'true') {
                console.log('ture');
                const channels = JSON.parse(await redis.get(`ob:7tveventapichannels`));
                if (channels.includes(channel.replace('#', '')))
                    return {
                        success: false,
                        message: 'Channel is already on 7TV emotes list. If it isn\'t working, use the "!suggest" command and report this error',
                        error: null,
                    };

                channels.push(channel.replace('#', ''));
                await redis.set(`ob:7tveventapichannels`, JSON.stringify(channels));
                return {
                    success: true,
                    message: 'Channel added to 7TV emotes notification list. These changes will be effected soon.',
                    error: null,
                };
            } else if (args[1] === 'false') {
                console.log('fasle');
                const channels = JSON.parse(await redis.get(`ob:7tveventapichannels`));
                if (!channels.includes(channel.replace('#', '')))
                    return {
                        success: false,
                        message: 'Channel is not on 7TV emotes list',
                        error: null,
                    };

                await redis.set(`ob:7tveventapichannels`, JSON.stringify(channels.filter((e: string) => e !== channel.replace('#', ''))));
                console.log('removed!', channels);
                return {
                    success: true,
                    message: 'Channel removed from 7TV emotes notification list. These changes will be effected soon.',
                    error: null,
                };
            } else {
                return {
                    success: false,
                    message: 'Invalid 7tv value (true/false)',
                    error: null,
                };
            }
        } else {
            return {
                success: false,
                message: 'Invalid target',
                error: null,
            };
        }
    };
}

export const cmd = new suggestCommand();
