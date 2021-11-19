import dotenv from 'dotenv';
import prettyMilliseconds from 'pretty-ms';
import { resolveUser } from '../utils/apis/ivr';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'accountage';
    description = 'Get the account age of a user';
    usage = 'accountage <username?>';
    userCooldown = 5;
    channelCooldown = 1;
    aliases = ['aa'];
    allowCustomPermissions = true;
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
            message: `${targetUser === user ? 'Your' : obfuscateName(targetUser) + "'s "} account was created ${prettyMilliseconds(Date.now() - new Date(userResp.user.createdAt).getTime(), {
                secondsDecimalDigits: 0,
            })} ago`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
