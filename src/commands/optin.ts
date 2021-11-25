import dotenv from 'dotenv';
import { redis } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { StalkUserData } from './stalk';
dotenv.config();

class suggestCommand extends Command {
    name = 'optin';
    description = 'Opt in of a certain feature';
    usage = 'optin <stalk>';
    userCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (args[0] == 'stalk') {
            let oldRedisData = await redis.get(`ob:stalk:${user}`);
            if (oldRedisData) {
                let oldData: StalkUserData = JSON.parse(oldRedisData);
                await redis.set(
                    `ob:stalk:${user}`,
                    JSON.stringify({
                        user: oldData.user,
                        message: oldData.message,
                        channel: oldData.channel,
                        timestamp: oldData.timestamp,
                        optedOut: false,
                    })
                );
            } else {
                await redis.set(
                    `ob:stalk:${user}`,
                    JSON.stringify({
                        user: null,
                        message: null,
                        channel: null,
                        timestamp: null,
                        optedOut: false,
                    })
                );
            }

            return {
                success: true,
                message: 'You have opted into the stalk command',
                error: null,
            };
        } else {
            return {
                success: false,
                message: 'Invalid feature to opt out of',
                error: null,
            };
        }
    };
}

export const cmd = new suggestCommand();
