import dotenv from 'dotenv';
import { redis } from '..';
import { resolveUser } from '../utils/apis/ivr';
import { Block } from '../utils/blockManager';
import { Command, CommandReturnClass, commands, ErrorEnum } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'block';
    description = 'Block a user from using a specific command';
    usage = 'block <user> <command?>';
    hidden = true;
    permission = 33;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        const targetUser = args[0].toLowerCase();

        if (!targetUser)
            return {
                success: false,
                message: null,
                error: ErrorEnum.MISSING_USER,
            };

        const targetCommand = args[1];

        if (!targetCommand) {
            const redisData = await redis.get(`ob:blockeddata:${targetUser}`);
            let blockedData: Block = null;

            if (redisData) {
                blockedData = JSON.parse(redisData);
            } else {
                blockedData = {
                    user: targetUser,
                    blockedAll: true,
                    commands: [],
                };
            }

            blockedData.blockedAll = true;

            await redis.set(`ob:blockeddata:${targetUser}`, JSON.stringify(blockedData));

            return {
                success: true,
                message: `${targetUser} has been blocked from using all commands`,
                error: null,
            };
        } else {
            if (!commands.has(targetCommand))
                return {
                    success: false,
                    message: 'Invalid command (use command name, not aliases)',
                    error: null,
                };

            const redisData = await redis.get(`ob:blockeddata:${targetUser}`);
            let blockedData: Block = null;
            if (redisData) {
                blockedData = JSON.parse(redisData);
            } else {
                blockedData = {
                    user: targetUser,
                    blockedAll: false,
                    commands: [],
                };
            }

            blockedData.commands.push(targetCommand);
            redis.set(`ob:blockeddata:${targetUser}`, JSON.stringify(blockedData));

            return {
                success: true,
                message: `${targetUser} has been blocked from using ${targetCommand}`,
                error: null,
            };
        }
    };
}

export const cmd = new suggestCommand();
