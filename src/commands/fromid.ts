import dotenv from 'dotenv';
import { apiClient } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'fromid';
    description = 'Get a username from an ID';
    usage = 'fromid <username>';
    userCooldown = 3;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Please specify a user ID',
                error: null,
            };

        if (!args[0].match(/^\d+$/))
            return {
                success: false,
                message: 'Please provide a valid user ID',
                error: null,
            };

        let userID = args[0];
        let userResp;
        try {
            userResp = await apiClient.users.getUserById(userID);
        } catch (err) {
            return {
                success: false,
                message: 'User not found',
                error: null,
            };
        }
        if (!userResp)
            return {
                success: false,
                message: 'User not found',
                error: null,
            };

        return {
            success: true,
            message: `${obfuscateName(userResp.displayName)} (${userResp.id})`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
