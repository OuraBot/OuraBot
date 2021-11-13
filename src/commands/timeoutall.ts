import dotenv from 'dotenv';
import { apiClient } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getClient } from '../utils/spamClients';
import { addTask, removeTask } from '../utils/taskManager';
dotenv.config();

let knownBots = [
    'streamlabs',
    'streamelements',
    'nightbot',
    'moobot',
    'wizebot',
    'streamdeckerbot',
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
    'supibot',
    'oura_bot',
];

class suggestCommand extends Command {
    name = 'timeoutall';
    description = 'Timeout everyone in your chat for a specified amount of time';
    usage = 'timeoutall <length>';
    userCooldown = 30;
    channelCooldown = 15;
    permission = 3;
    requiresMod = true;
    allowCustomPermissions = true;
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

        addTask(channel, this.name);

        for (let chatter of chatters) {
            getClient().say(channel, `/timeout ${chatter} ${length}`);
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
