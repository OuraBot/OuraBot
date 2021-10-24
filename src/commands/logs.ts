import dotenv from 'dotenv';
import { isLoggedChannel } from '../utils/apis/ivr';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'logs';
    description = 'View the logs of a user. (specified channel must have justlog logs enabled)';
    usage = 'logs <user?> <channel?> <normal,mod?>';
    userCooldown = 5;
    channelCooldown = 1;
    allowCustomPermissions = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let targetUser = args[0]?.replace('@', '')?.replace(',', '').toLowerCase() || user.toLowerCase();
        let targetChannel = args[1]?.replace('#', '')?.replace('@', '')?.replace(',', '').toLowerCase() || channel?.replace('#', '')?.replace('@', '')?.replace(',', '').toLowerCase();

        let isLogged = await isLoggedChannel(targetChannel);
        if (isLogged.error) throw new Error(isLogged.error);
        if (!isLogged.logged) {
            return {
                success: true,
                message: `${targetChannel === channel.replace('#', '') ? 'This channel' : 'The specified'} is not logged on the justlog logs site (https://logs.ivr.fi)`,
                error: null,
            };
        }

        if (args[2] === 'mod') {
            return {
                success: true,
                message: `Logs for ${obfuscateName(targetUser)} in #${obfuscateName(targetChannel)}: https://logs.bnsvc.net/${targetChannel}/${targetUser}`,
                error: null,
            };
        } else {
            return {
                success: true,
                message: `Logs for ${obfuscateName(targetUser)} in #${obfuscateName(targetChannel)}: https://logs.ivr.fi/?channel=${targetChannel}&username=${targetUser}`,
                error: null,
            };
        }
    };
}

export const cmd = new suggestCommand();
