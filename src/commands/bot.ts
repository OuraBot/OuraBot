import dotenv from 'dotenv';
import { isUserBot } from '../utils/apis/ivr';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'bot';
    description = 'Check if a user is a known/verified bot';
    usage = 'bot <user>';
    userCooldown = 3;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: null,
                error: ErrorEnum.MISSING_USER,
            };

        let targetUser = args[0];

        let userResp;
        try {
            userResp = await isUserBot(targetUser);
        } catch (err) {
            return {
                success: false,
                message: 'User not found',
                error: null,
            };
        }

        if (!userResp.success)
            return {
                success: false,
                message: 'User not found',
                error: null,
            };

        return {
            success: true,
            message: `${userResp.user.display_name}: Verified Bot: ${userResp.user.verified} | Known Bot: ${userResp.user.known}`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
