import dotenv from 'dotenv';
import { resolveUser } from '../utils/apis/ivr';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'pfp';
    description = 'Get the profile picture URL for a user';
    usage = 'pfp <user?>';
    aliases = ['profilepicture'];
    userCooldown = 5;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let targetUser = args[0] || user;

        let userData = await resolveUser(targetUser);
        if (!userData.success)
            return {
                success: false,
                message: 'Invalid user',
                error: null,
            };

        return {
            success: true,
            message: `${targetUser == user ? 'Your' : obfuscateName(targetUser) + "'s"} profile picture is available at ${userData.user.logo}`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
