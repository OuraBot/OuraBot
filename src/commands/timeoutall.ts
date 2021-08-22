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
    description = 'Timeout everyone for a specified amount of time - MAKE SURE ANY OTHER BOTS YOU DONT WANT TO BE TIMED OUT ARE MODS! THEY MIGHT LEAVE THE CHANNEL IF THEY GET TIMED OUT';
    usage = 'timeoutall <length>';
    userCooldown = 10;
    channelCooldown = 10;
    permission = 2;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let length = args[0] || 1;
        let chatters = (await apiClient.unsupported.getChatters(channel.replace('#', ''))).allChatters;
        chatters = chatters.filter((c) => !knownBots.includes(c));

        if (chatters.length === 0)
            return {
                success: false,
                message: 'No users are in this chat right now that I can timeout',
                error: null,
            };

        if (chatters.length > 100)
            return {
                success: false,
                message: 'Too many users to timeout',
                error: null,
            };

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
