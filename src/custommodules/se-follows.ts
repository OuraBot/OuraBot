import { Redis } from 'ioredis';
import { ChatClient } from 'twitch-chat-client/lib';
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { KNOWN_BOT_LIST } from '../utils/knownBots';
import { CustomModule } from '../types/custommodule';
import { config } from '..';
import { obfuscateName } from '../utils/stringManipulation';

// .*h(o|0)ss0?

class customModule extends CustomModule {
    name = 'se-follows';
    description = "Compares the user in StreamElement's follow chat message to a hash of known bots";
    channels = ['#demonjoefrance', '#auror6s', '#jeffboys123', '#elpws', '#mmattbtw', '#docwaitingroom', '#liptongod', '#c3agle'];
    author = ['AuroR6S'];
    execute = async (channel: string, user: string, message: string, msg: TwitchPrivateMessage, chatClient: ChatClient, redis: Redis): Promise<void> => {
        if (user === 'auror6s' || user === 'streamelements' || user === 'fossabot') {
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
                            } else if (username.match(/.*h(o|0)ss0?/)) {
                                chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                    console.log(err); // Error handling here isnt too important
                                });
                                chatClient.say(config.owner, `${username} is NOT on the known bot list and has been banned in ${obfuscateName(channel)} - This was matched using the regex`);
                            }
                        }
                    }
                    break;

                case '#auror6s':
                    {
                        if (message.match(/^([A-z0-9_]+) just followed peepoGladLoveDank/)) {
                            const username = message.match(/^([A-z0-9_]+) just followed peepoGladLoveDank/)[1];
                            if (KNOWN_BOT_LIST.has(username)) {
                                chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                    console.log(err); // Error handling here isnt too important
                                });
                            } else if (username.match(/.*h(o|0)ss0?/)) {
                                chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                    console.log(err); // Error handling here isnt too important
                                });
                                chatClient.say(config.owner, `${username} is NOT on the known bot list and has been banned in ${obfuscateName(channel)} - This was matched using the regex`);
                            }
                        }
                    }
                    break;

                case '#jeffboys123':
                    {
                        if (message.match(/^xqcKiss Thank you for the follow @([A-z0-9_]+)/)) {
                            const username = message.match(/^([A-z0-9_]+) just followed peepoGladLoveDank/)[1];
                            if (KNOWN_BOT_LIST.has(username)) {
                                chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                    console.log(err); // Error handling here isnt too important
                                });
                            } else if (username.match(/.*h(o|0)ss0?/)) {
                                chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                    console.log(err); // Error handling here isnt too important
                                });
                                chatClient.say(config.owner, `${username} is NOT on the known bot list and has been banned in ${obfuscateName(channel)} - This was matched using the regex`);
                            }
                        }
                    }
                    break;

                case '#elpws':
                    {
                        if (message.match(/^THANK YOU ([A-z0-9_]+) FOR THE FOLLOW TriHard/)) {
                            const username = message.match(/^THANK YOU ([A-z0-9_]+) FOR THE FOLLOW TriHard/)[1];
                            console.log(username);
                            if (KNOWN_BOT_LIST.has(username)) {
                                chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                    console.log(err); // Error handling here isnt too important
                                });
                            } else if (username.match(/.*h(o|0)ss0?/)) {
                                chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                    console.log(err); // Error handling here isnt too important
                                });
                                chatClient.say(config.owner, `${username} is NOT on the known bot list and has been banned in ${obfuscateName(channel)} - This was matched using the regex`);
                            }
                        }
                    }
                    break;
                
                case '#mmattbtw': 
                {
                    if (message.match(/^([A-z0-9_]+) followed! peepoLove thank you/)) {
                        const username = message.match(/^([A-z0-9_]+) followed! peepoLove thank you/)[1];
                        console.log(username);
                        if (KNOWN_BOT_LIST.has(username)) {
                            chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                console.log(err); // Error handling here isnt too important
                            });
                        } else if (username.match(/.*h(o|0)ss0?/)) {
                            chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                console.log(err); // Error handling here isnt too important
                            });
                            chatClient.say(config.owner, `${username} is NOT on the known bot list and has been banned in ${obfuscateName(channel)} - This was matched using the regex`);
                        }
                    }
                }
                break;
                case '#docwaitingroom':
                    {
                        if (message.match(/^([A-z0-9_]+) docL/)) {
                            const username = message.match(/^([A-z0-9_]+) docL/)[1];
                            console.log(username);
                            if (KNOWN_BOT_LIST.has(username)) {
                                chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                    console.log(err); // Error handling here isnt too important
                                });
                            } else if (username.match(/.*h(o|0)ss0?/)) {
                                chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                    console.log(err); // Error handling here isnt too important
                                });
                                chatClient.say(config.owner, `${username} is NOT on the known bot list and has been banned in ${obfuscateName(channel)} - This was matched using the regex`);
                            }
                        }
                    }
                    break;
                case '#liptongod':
                    {
                        if (message.match(/^pajaMLADA ❤ ([A-z0-9_]+)/)) {
                            const username = message.match(/^pajaMLADA ❤ ([A-z0-9_]+)/)[1];
                            console.log(username);
                            if (KNOWN_BOT_LIST.has(username)) {
                                chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                    console.log(err); // Error handling here isnt too important
                                });
                            } else if (username.match(/.*h(o|0)ss0?/)) {
                                chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                    console.log(err); // Error handling here isnt too important
                                });
                                chatClient.say(config.owner, `${username} is NOT on the known bot list and has been banned in ${obfuscateName(channel)} - This was matched using the regex`);
                            }
                        }
                    }
                    break;
                case '#c3agle': 
                {
                    if (message.match(/^([A-z0-9_]+) followed! peepoLove thank you/)) {
                        const username = message.match(/^([A-z0-9_]+) followed! peepoLove thank you/)[1];
                        console.log(username);
                        if (KNOWN_BOT_LIST.has(username)) {
                            chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                console.log(err); // Error handling here isnt too important
                            });
                        } else if (username.match(/.*h(o|0)ss0?/)) {
                            chatClient.ban(channel, username, 'User is on known bot list (follow/hate/ip grabber bots)').catch((err) => {
                                console.log(err); // Error handling here isnt too important
                            });
                            chatClient.say(config.owner, `${username} is NOT on the known bot list and has been banned in ${obfuscateName(channel)} - This was matched using the regex`);
                        }
                    }
                }
                break;
        }}
    };
}

export const module = new customModule();
