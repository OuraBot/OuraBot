import dotenv from 'dotenv';
import { apiClient } from '..';
import { getBestEmote } from '../utils/channelEmotes';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getClient } from '../utils/spamClients';
import { addTask, removeTask } from '../utils/taskManager';
dotenv.config();

class suggestCommand extends Command {
    name = 'bingall';
    description = 'Ping everyone in your chat';
    usage = 'bingall';
    aliases = ['pingall', 'chaos'];
    userCooldown = 30;
    channelCooldown = 15;
    requiresMod = true;
    allowCustomPermissions = true;
    permission = 3;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let chatters = (await apiClient.unsupported.getChatters(channel.replace('#', ''))).allChatters;
        const msg = args.join(' ') || (await getBestEmote(channel, ['Bing', 'DinkDonk', 'dinkDonk', 'pajaDink'], '')).bestAvailableEmote;
        addTask(channel, this.name);
        for (let chatter of chatters) {
            getClient().say(channel, `@${chatter} ${msg}`);
        }
        removeTask(channel, this.name);
        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
