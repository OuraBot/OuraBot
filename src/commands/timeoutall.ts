import dotenv from 'dotenv';
import { apiClient, chatClient } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
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
    name = 'timeoutall';
    description = 'Timeout';
    usage = 'timeoutall <length>';
    userCooldown = 1;
    channelCooldown = 1;
    permission = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let length = args[0] || 1;
        chatClient.say(channel, 'ItsBoshyTime TIMING OUT *EVERYONE* ItsBoshyTime ');
        let chatters = (await apiClient.unsupported.getChatters(channel.replace('#', ''))).allChatters;
        chatters = chatters.filter((c) => !knownBots.includes(c));

        for (let chatter of chatters) {
            chatClient.say(channel, `/timeout ${chatter} ${length}`);
        }

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
