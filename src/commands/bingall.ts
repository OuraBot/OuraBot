import dotenv from 'dotenv';
import { apiClient, chatClient, redis } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
import { getBestEmote } from '../utils/channelEmotes';
import { chunkArr } from '../utils/stringManipulation';
import { getClient } from '../utils/spamClients';
dotenv.config();

class suggestCommand extends Command {
    name = 'bingall';
    description = 'Ping everyone in your chat';
    usage = 'bingall';
    aliases = ['pingall', 'chaos'];
    userCooldown = 10;
    channelCooldown = 10;
    permission = 2;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let chatters = (await apiClient.unsupported.getChatters(channel.replace('#', ''))).allChatters;
        const msg = args.join(' ') || (await getBestEmote(channel, ['Bing', 'DinkDonk', 'dinkDonk', 'pajaDink'], '')).bestAvailableEmote;
        for (let chatter of chatters) {
            getClient().say(channel, `@${chatter} ${msg}`);
        }
        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
