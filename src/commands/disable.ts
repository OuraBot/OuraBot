import dotenv from 'dotenv';
import { redis } from '../index';
import { Command, CommandReturnClass, getCommands } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'disable';
    description = 'Disable a command for the channel';
    usage = 'disable <command>';
    permission = 4;
    userCooldown = 3;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing target command',
                error: null,
            };

        channel = channel.replace('#', '');
        let command: string;
        (await getCommands()).forEach(async (c: Command) => {
            if (!c?.hidden) {
                if (c.name === args[0]) {
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

        let blockedCommands = ['disable', 'enable'];

        if (blockedCommands.indexOf(command) > -1)
            return {
                success: false,
                message: 'You cannot disable this command',
                error: null,
            };

        let RedisData: any = await redis.get(`disabledcommands:${channel}`);
        if (!RedisData) {
            RedisData = {
                channel: channel,
                disabled: [command],
            };
            redis.set(`disabledcommands:${channel}`, JSON.stringify(RedisData));
        } else {
            RedisData = JSON.parse(RedisData);
            if (RedisData.disabled.includes(command)) {
                return {
                    success: false,
                    message: 'Command already disabled',
                    error: null,
                };
            }
            RedisData.disabled.push(command);
            redis.set(`disabledcommands:${channel}`, JSON.stringify(RedisData));
        }

        return {
            success: true,
            message: `${command} is now disabled!`,
            error: null,
        };
    };
}

export const cmd = new testComand();
