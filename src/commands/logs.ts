import dotenv from 'dotenv';
import { chatClient, redis } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
import { obfuscateName } from '../utils/stringManipulation';
import { isLoggedChannel } from '../utils/apis/ivr';
import { error } from '../utils/logger';
dotenv.config();

class suggestCommand extends Command {
    name = 'logs';
    description = 'View the logs of a user. (channel specified must have justlog bot joined)';
    usage = 'logs <user?> <channel?> <normal,mod?>';
    userCooldown = 5;
    channelCooldown = 3;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let targetUser = args[0]?.replace('@', '')?.replace(',', '') || user;
        let targetChannel = args[1]?.replace('#', '')?.replace('@', '')?.replace(',', '') || channel?.replace('#', '')?.replace('@', '')?.replace(',', '');

        let isLogged = await isLoggedChannel(targetChannel);
        console.log(isLogged);
        if (isLogged.error) error(isLogged.error, ['isLoggedChannel error!!! 🚨']);
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
