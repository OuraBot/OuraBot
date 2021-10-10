import dotenv from 'dotenv';
import { apiClient, chatClient, redis } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
import { obfuscateName } from '../utils/stringManipulation';
import { subageLookup } from '../utils/apis/ivr';
import moment from 'moment';
dotenv.config();

class suggestCommand extends Command {
    name = 'followage';
    description = 'Check how long a user has been following a channel';
    usage = 'followage <username> <channel>';
    userCooldown = 3;
    channelCooldown = 1;
    aliases = ['fa'];
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
                message: `${targetUser.toLowerCase() === user.toLowerCase() ? 'You have' : `${obfuscateName(targetUser)} has`} been following ${obfuscateName(targetChannel)} for ${prettyTime(
                    followedAt
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
