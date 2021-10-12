import dotenv from 'dotenv';
import { resolveUser } from '../utils/apis/ivr';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'banned';
    description = 'Check if a specified user is banned on Twitch';
    usage = 'banned <username>';
    userCooldown = 3;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: null,
                error: ErrorEnum.MISSING_USER,
            };

        if (args[0].toLowerCase() === user.toLowerCase())
            return {
                success: true,
                message: 'How would you send this message if you were banned? 🤔',
                error: null,
            };

        if (args[0].toLowerCase() === process.env.CLIENT_USERNAME.toLowerCase())
            return {
                success: true,
                message: 'monkaS Am I banned..?',
                error: null,
            };

        let userResp = await resolveUser(args[0]);
        if (!userResp.success)
            return {
                success: false,
                message: 'User not found',
                error: null,
            };

        return {
            success: true,
            message: `${obfuscateName(userResp.user.displayName)}: ${userResp.user.banned ? '⛔ BANNED' : 'Not banned'}`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
