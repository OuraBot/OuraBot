import dotenv from 'dotenv';
import { apiClient } from '..';
import { getBestEmote } from '../utils/channelEmotes';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getClient } from '../utils/spamClients';
dotenv.config();

class suggestCommand extends Command {
    name = 'bingall';
    description = 'Ping everyone in your chat';
    usage = 'bingall';
    aliases = ['pingall', 'chaos'];
    userCooldown = 10;
    channelCooldown = 10;
    requireFastLimits = true;
    permission = 3;
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
