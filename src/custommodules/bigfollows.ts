import { ChatClient } from '@twurple/chat';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import { Redis } from 'ioredis';
import { config } from '..';
import { CustomModule } from '../types/custommodule';
import { KNOWN_BOT_LIST } from '../utils/knownBots';
import { obfuscateName, removeAccents } from '../utils/stringManipulation';

class customModule extends CustomModule {
    name = 'bigfollows';
    description = "Checks if a user's first message is a bigfollows advertisement";
    channels = ['#auror6s', '#mmattbtw', '#demonjoe', '#liptongod', '#elpws', '#c3agle', '#xoosd', '#ktobaias'];
    author = ['AuroR6S'];
    execute = async (channel: string, user: string, message: string, msg: TwitchPrivateMessage, chatClient: ChatClient): Promise<void> => {
        if (msg.tags.get('first-msg') == '1') {
            let looseMessage = removeAccents(message.toLowerCase());
            if (looseMessage.includes('wanna become famous?') || looseMessage.includes('want to become famous?') || looseMessage.includes('vk.cc')) {
                chatClient.ban(channel, user, 'Follow bot advertisement bot');
                chatClient.say(config.owner, `CUSTOMMODULE big-follows: ${user} banned in ${obfuscateName(channel)}`);
            }
        }
    };
}

export const module = new customModule();
