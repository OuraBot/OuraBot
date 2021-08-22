import dotenv from 'dotenv';
import { apiClient, chatClient, redis } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
import { getBestEmote } from '../utils/channelEmotes';
import { chunkArr } from '../utils/stringManipulation';
dotenv.config();

let knownBots = [
    'streamlabs',
    'streamelements',
    'nightbot',
    'moobot',
    'wizebot',
    'streamdeckerbot',
    'vivbot',
    'dinu',
    'streamkit',
    'tipeeebot',
    'logviewer',
    'buttsbot',
    'lattemotte',
    'mirrobot',
    'streamjar',
    'overrustlelogs',
    'amazeful',
    'amazefulbot',
    'creatisbot',
    'soundalerts',
    'fossabot',
    'mikuia',
    'supibot',
    'oura_bot',
];

class suggestCommand extends Command {
    name = 'chaos';
    description = 'Start chaos in your chat';
    usage = 'chaos';
    userCooldown = 30;
    channelCooldown = 30;
    permission = 2;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let chatters = (await apiClient.unsupported.getChatters(channel.replace('#', ''))).allChatters;
        let preferredEmote = await getBestEmote(channel, ['DinkDonk', 'dinkDonk', 'pajaDink'], ':tf: 🔔');
        chatters = chatters.filter((c) => !knownBots.includes(c));
        let chunkedChatters = chunkArr(chatters, 400, ' ');
        for (let msg of chunkedChatters) {
            if (chunkedChatters.length == 1) {
                for (let i = 0; i < 10; i++) {
                    await chatClient.say(channel, `${preferredEmote.bestAvailableEmote} ${msg}`);
                }
            } else if (chunkedChatters.length == 2) {
                for (let i = 0; i < 5; i++) {
                    await chatClient.say(channel, `${preferredEmote.bestAvailableEmote} ${msg}`);
                }
            } else {
                await chatClient.say(channel, `${preferredEmote.bestAvailableEmote} ${msg}`);
            }
        }
        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
