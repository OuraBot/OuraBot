import dotenv from 'dotenv';
import prettyMilliseconds from 'pretty-ms';
import { subageLookup } from '../utils/apis/ivr';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'followage';
    description = 'Check how long a user has been following a channel';
    usage = 'followage <username> <channel>';
    userCooldown = 5;
    channelCooldown = 1;
    aliases = ['fa'];
    allowCustomPermissions = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let targetUser = args[0]?.replace('@', '')?.replace(',', '')?.replace('#', '') || user;
        let targetChannel = args[1]?.replace('@', '')?.replace(',', '')?.replace('#', '') || channel.replace('#', '');

        let userResp = await subageLookup(targetUser, targetChannel);
        if (!userResp.success)
            return {
                success: false,
                message: 'User or channel not found',
                error: null,
            };

        if (userResp.data.followedAt) {
            let followedAt = Date.now() - new Date(userResp.data.followedAt).getTime();
            return {
                success: true,
                message: `${targetUser.toLowerCase() === user.toLowerCase() ? 'You have' : `${obfuscateName(targetUser)} has`} been following ${obfuscateName(targetChannel)} for ${prettyMilliseconds(
                    followedAt,
                    {
                        secondsDecimalDigits: 0,
                    }
                )}`,
                error: null,
            };
        } else {
            return {
                success: true,
                message: `${targetUser.toLowerCase() === user.toLowerCase() ? 'You are' : `${obfuscateName(targetUser)} is`} not following ${obfuscateName(targetChannel)}`,
                error: null,
            };
        }
    };
}

export const cmd = new suggestCommand();
