import dotenv from 'dotenv';
import { resolveUser } from '../utils/apis/ivr';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'id';
    description = 'Get the ID of a specified user';
    usage = 'id <username?>';
    userCooldown = 3;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let targetUser = args[0] || user;

        let userResp;
        try {
            userResp = await resolveUser(targetUser);
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
            message: `${userResp.user.id} ${userResp.user.banned ? '⛔ BANNED' : ''} (${obfuscateName(userResp.user.displayName)})`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
