import { ChatClient } from '@twurple/chat';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import axios from 'axios';
import { Redis } from 'ioredis';
import { CustomModule } from '../types/custommodule';

class customModule extends CustomModule {
    name = 'requestjoin';
    description = 'Requests the bot to be in their channel';
    channels = ['#auror6s', '#oura_bot'];
    author = ['AuroR6S'];
    execute = async (channel: string, user: string, message: string, msg: TwitchPrivateMessage, chatClient: ChatClient, redis: Redis): Promise<void> => {
        if (message.startsWith('!requestjoin')) {
            chatClient.say(channel, `@${user}, The bot has been requested to join your channel! Please wait for one of the admins to add it to your channel`);
            axios.post(process.env.DISCORD_WEBHOOK, {
                username: 'Oura_Bot Request',
                content: `@everyone ${user} has requested the bot to join their channel! (${msg.userInfo.userId})`,
            });
        }
    };
}

export const module = new customModule();
