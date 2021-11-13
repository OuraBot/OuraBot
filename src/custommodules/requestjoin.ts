import { ChatClient } from '@twurple/chat';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import axios from 'axios';
import { Redis } from 'ioredis';
import { discordManager } from '..';
import { CustomModule } from '../types/custommodule';
import { getAllEmotes, getBttvChannelEmotes, getFfzChannelEmotes, getStvChannelEmotes } from '../utils/channelEmotes';

class customModule extends CustomModule {
    name = 'requestjoin';
    description = 'Requests the bot to be in their channel';
    channels = ['#auror6s', '#oura_bot'];
    author = ['AuroR6S'];
    execute = async (channel: string, user: string, message: string, msg: TwitchPrivateMessage, chatClient: ChatClient, redis: Redis): Promise<void> => {
        if (message == '!requestjoin') {
            chatClient.say(channel, `@${user}, The bot has been requested to join your channel! Please wait for one of the admins to add it to your channel`);
            discordManager.postJoinRequest(user, msg.userInfo.userId);
        } else if (message.toLowerCase().startsWith(`!requestjoin ${user.toLowerCase()}`)) {
            chatClient.say(channel, `@${user}, The bot has been requested to join your channel! Please wait for one of the admins to add it to your channel`);
            discordManager.postJoinRequest(user, msg.userInfo.userId);
        } else if (message.startsWith('!requestjoin')) {
            chatClient.say(channel, `@${user}, Only the broadcaster can request me to join their channel. Please ask them to use the "!requestjoin" command here.`);
        }
    };
}

export const module = new customModule();
