import dotenv from 'dotenv';
import { apiClient, chatClient, redis } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
import { getBestEmote } from '../utils/channelEmotes';
dotenv.config();

class suggestCommand extends Command {
    name = 'bing';
    description = 'Ping a random user in the chat';
    usage = 'bing';
    userCooldown = 15;
    channelCooldown = 15;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let chatters = (await apiClient.unsupported.getChatters(channel.replace('#', ''))).allChatters;
        let preferredEmote = await getBestEmote(channel, ['Bing', 'DinkDonk', 'dinkDonk', 'pajaDink'], ':tf: 🔔');
        return {
            success: true,
            message: `${preferredEmote.bestAvailableEmote} @${chatters[Math.floor(Math.random() * chatters.length)]}`,
            error: null,
            noping: true,
        };
    };
}

export const cmd = new suggestCommand();
