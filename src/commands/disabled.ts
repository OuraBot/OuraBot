import dotenv from 'dotenv';
import { redis } from '../index';
import { Command, CommandReturnClass } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'disabled';
    description = 'Lists all of the disabled commands for the channel';
    usage = 'disabled';
    channelCooldown = 10;
    userCooldown = 10;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let RedisData: any = await redis.get(`disabledcommands:${channel.replace('#', '')}`);
        if (RedisData) {
            RedisData = JSON.parse(RedisData);
            return {
                success: true,
                message: `The disabled commands are: ${RedisData.disabled.join(', ').replace(/,(?!.*,)/gim, ', and')}`,
                error: null,
            };
        } else {
            return {
                success: true,
                message: 'There are no disabled commands for this channel',
                error: null,
            };
        }
    };
}

export const cmd = new testComand();
