import dotenv from 'dotenv';
import { config, redis } from '../index';
import { Command, CommandReturnClass, getCommands } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'enable';
    description = 'Enable a command for the channel';
    usage = 'enable <command>';
    permission = 2;
    userCooldown = 3;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing target command',
                error: null,
            };

        let channelPrefix = await redis.get(`ob:${channel}:prefix`);
        if (channelPrefix) {
            channelPrefix = channelPrefix;
        } else {
            channelPrefix = process.env.DEBUG === 'TRUE' ? config.debugprefix : config.prefix;
        }

        channel = channel.replace('#', '');
        let command: string;
        (await getCommands()).forEach(async (c: Command) => {
            if (!c?.hidden) {
                if (c.name === args[0].replace(channelPrefix, '')) {
                    command = c.name;
                }
            }
        });

        if (!command)
            return {
                success: false,
                message: 'Command not found',
                error: null,
            };

        let RedisData: any = await redis.get(`disabledcommands:${channel}`);
        if (!RedisData) {
            return {
                success: false,
                message: 'There are no commands disabled for this channel',
                error: null,
            };
        } else {
            RedisData = JSON.parse(RedisData);
            if (RedisData.disabled.includes(command)) {
                RedisData.disabled.splice(RedisData.disabled.indexOf(command), 1);
                await redis.set(`disabledcommands:${channel}`, JSON.stringify(RedisData));
                return {
                    success: true,
                    message: 'Command enabled',
                    error: null,
                };
            } else {
                return {
                    success: false,
                    message: 'Command is not disabled',
                    error: null,
                };
            }
        }
    };
}

export const cmd = new testComand();
