import { Redis } from 'ioredis';
import { ChatClient } from 'twitch-chat-client/lib';
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { KNOWN_BOT_LIST } from '..';
import { CustomModule } from '../types/custommodule';

class customModule extends CustomModule {
    name = 'se-follows';
    description = "Compares the user in StreamElement's follow chat message to a hash of known bots";
    channels = ['#demonjoefrance'];
    author = ['AuroR6S'];
    execute = async (channel: string, user: string, message: string, msg: TwitchPrivateMessage, chatClient: ChatClient, redis: Redis): Promise<void> => {
        if (user === 'auror6s' || user === 'streamelements') {
            switch (channel) {
                case '#demonjoefrance':
                    {
                        if (message.match(/^([A-z0-9_]+) just became a boyo! djfWAVE/)) {
                            const username = message.match(/^([A-z0-9_]+) just became a boyo! djfWAVE/)[1];
                            if (KNOWN_BOT_LIST.has(username)) {
                                chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                    console.log(err); // Error handling here isnt too important
                                });
                                chatClient.say(channel, `${username} is on the known bot list and has been banned`);
                            }
                        }
                    }
                    break;
            }
        }
    };
}

export const module = new customModule();
