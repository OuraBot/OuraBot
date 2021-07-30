import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import Redis from 'ioredis';
import { connect } from 'mongoose';
import { ApiClient } from 'twitch';
import { ClientCredentialsAuthProvider, RefreshableAuthProvider, StaticAuthProvider } from 'twitch-auth';
import { ChatClient } from 'twitch-chat-client';
import { createNewError } from './models/error.model.js';
import { Reminder } from './models/reminder.model.js';
import { Command, CommandReturnClass, getCommands, PermissionEnum } from './utils/commandClass.js';
import { getConfig } from './utils/config.js';
import { getChannels } from './utils/fetchChannels';
import { error } from './utils/logger.js';
import { prettyTime } from './utils/auroMs';
import { chunkArr } from './utils/stringManipulation.js';
import { CustomCommand, ICustomCommand } from './models/command.model.js';
import axios from 'axios';
import { Afk, IAfk, Status } from './models/afk.model.js';
import { Term } from './models/term.model.js';
import { Module } from './models/module.model.js';
import { moduleEnum } from './commands/modmodule.js';
import getUrls from 'get-urls';

const ASCII_REGEX =
    /([─│┌┐└┘├┤┬┴┼═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬╤╥▀▄█▌▐░▒▓■□▪▫▬▲►▼◄⠁⠂⠄⠈⠐⠠⡀⢀⠃⠅⠉⠑⠡⡁⢁⠆⠊⠒⠢⡂⢂⠌⠔⠤⡄⢄⠘⠨⡈⢈⠰⡐⢐⡠⢠⣀⠇⠋⠓⠣⡃⢃⠍⠕⠥⡅⢅⠙⠩⡉⢉⠱⡑⢑⡡⢡⣁⠎⠖⠦⡆⢆⠚⠪⡊⢊⠲⡒⢒⡢⢢⣂⠜⠬⡌⢌⠴⡔⢔⡤⢤⣄⠸⡘⢘⡨⢨⣈⡰⢰⣐⣠⠏⠗⠧⡇⢇⠛⠫⡋⢋⠳⡓⢓⡣⢣⣃⠝⠭⡍⢍⠵⡕⢕⡥⢥⣅⠹⡙⢙⡩⢩⣉⡱⢱⣑⣡⠞⠮⡎⢎⠶⡖⢖⡦⢦⣆⠺⡚⢚⡪⢪⣊⡲⢲⣒⣢⠼⡜⢜⡬⢬⣌⡴⢴⣔⣤⡸⢸⣘⣨⣰⠟⠯⡏⢏⠷⡗⢗⡧⢧⣇⠻⡛⢛⡫⢫⣋⡳⢳⣓⣣⠽⡝⢝⡭⢭⣍⡵⢵⣕⣥⡹⢹⣙⣩⣱⠾⡞⢞⡮⢮⣎⡶⢶⣖⣦⡺⢺⣚⣪⣲⡼⢼⣜⣬⣴⣸⠿⡟⢟⡯⢯⣏⡷⢷⣗⣧⡻⢻⣛⣫⣳⡽⢽⣝⣭⣵⣹⡾⢾⣞⣮⣶⣺⣼⡿⢿⣟⣯⣷⣻⣽⣾⣿⠀]{5,})/gim;

dotenv.config();

export const config = getConfig();
// const apiTokens = getAPITokens();
// const TMITokens = getTMITokens();

export const redis = new Redis();

/*
const ApiAuth = new RefreshingAuthProvider(
    {
        clientId: process.env.APP_CLIENTID,
        clientSecret: process.env.APP_SECRET,
        onRefresh: async (newToken) => await fs.writeFile('./src/APItokens.json', JSON.stringify(newToken, null, 4), 'utf-8'),
    },
    apiTokens
    );
*/

/*
const tmiAuth = new RefreshingAuthProvider(
    {
        clientId: process.env.APP_CLIENTID,
        clientSecret: process.env.APP_SECRET,
        onRefresh: async (newToken) => await fs.writeFile('./src/TMItokens.json', JSON.stringify(newToken, null, 4), 'utf-8'),
    },
    TMITokens
);
*/

let commands = getCommands();
export function refreshCommands() {
    commands = getCommands();
}

export let chatClient: ChatClient;
export let apiClient: ApiClient;
export let apiClient2: ApiClient;

async function main(): Promise<void> {
    const clientId = process.env.APP_CLIENTID;
    const clientSecret = process.env.APP_SECRET;
    const tokenData = JSON.parse(await fs.readFile('./tokens.json', 'utf-8'));
    const auth = new RefreshableAuthProvider(new StaticAuthProvider(clientId, tokenData.accessToken, ['clips:edit', 'chat:read', 'chat:edit', 'channel:moderate']), {
        clientSecret,
        refreshToken: tokenData.refreshToken,
        expiry: tokenData.expiryTimestamp === null ? null : new Date(tokenData.expiryTimestamp),
        onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
            const newTokenData = {
                accessToken,
                refreshToken,
                expiryTimestamp: expiryDate === null ? null : expiryDate.getTime(),
            };
            await fs.writeFile('./tokens.json', JSON.stringify(newTokenData, null, 4), 'utf-8');
        },
    });

    const authProvider: ClientCredentialsAuthProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
    apiClient = new ApiClient({ authProvider });
    apiClient2 = new ApiClient({ authProvider: auth });

    connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    chatClient = new ChatClient(
        auth,
        process.env.DEBUG === 'TRUE'
            ? {
                  channels: ['auror6s'],
              }
            : {
                  channels: await getChannels(process.env.CLIENT_USERNAME),
              }
    );

    /*
    Channel.find().then((ch: IChannel[]) => {
        for (let channel of ch) {
            chatClient.join(`#${channel.channel.toLocaleUpperCase()}`);
        }

        
        for (let channel of ch.filter((c: IChannel) => c.bot === process.env.CLIENT_USERNAME)) {
            chatClient.join(`${channel.channel}`);
        }
        
    });
    */

    chatClient.onNotice((target, user, message, msg) => {
        if (msg.tagsToString() === 'msg-id=msg_rejected_mandatory') {
            chatClient.say(target, `A message that was about to be posted violates this channel's moderation settings.`);
        }
    });

    chatClient.onJoin((channel, user) => {
        console.log(`${user} joined ${channel}`);

        // if (channel === '#auror6s') chatClient.say('auror6s', `PagMan VERSION 2 BOT CONNECTED ${process.env.DEBUG === 'TRUE' ? 'IN DEBUG MODE' : ''}`);
    });

    let commands = await getCommands();
    chatClient.onMessage(async (channel, user, message, msg) => {
        Module.find().then(async (modules) => {
            if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
                // Using '!' before the msg.userInfo doesn't work for some odd reason
            } else {
                for (let module of modules) {
                    if (module.channel === channel.replace('#', '')) {
                        if (module.module === moduleEnum.ASCII) {
                            if (message.match(ASCII_REGEX)?.length > 5) {
                                let redisData: string | number = await redis.get(`ASCII:${channel}:${user}`);
                                if (redisData) {
                                    redisData = Number(redisData);
                                    let nextLen = redisData * 2;
                                    await chatClient.say(channel, `/timeout ${user} ${redisData} ASCII Mod Module (next timeout will be ${nextLen}s)`);
                                    await redis.set(`ASCII:${channel}:${user}`, nextLen, 'EX', 3600);
                                    return;
                                } else {
                                    await redis.set(`ASCII:${channel}:${user}`, module.timeout, 'EX', 3600);
                                    await chatClient.say(channel, `/timeout ${user} ${module.timeout} ASCII Mod Module (next timeout will be ${module.timeout * 2}s)`);
                                    return;
                                }
                            }
                        } else if (module.module === moduleEnum.LINKS) {
                            if (getUrls(message).size > 0) {
                                let redisData: string | number = await redis.get(`LINKS:${channel}:${user}`);
                                if (redisData) {
                                    redisData = Number(redisData);
                                    let nextLen = redisData * 2;
                                    await chatClient.say(channel, `/timeout ${user} ${redisData} URL Mod Module (next timeout will be ${nextLen}s)`);
                                    await redis.set(`LINKS:${channel}:${user}`, nextLen, 'EX', 3600);
                                    return;
                                } else {
                                    await redis.set(`LINKS:${channel}:${user}`, module.timeout * 2, 'EX', 3600);
                                    await chatClient.say(channel, `/timeout ${user} ${module.timeout} URL Mod Module (next timeout will be ${module.timeout * 2}s)`);
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        });

        Term.find().then((terms) => {
            if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
                // Using '!' before the msg.userInfo doesn't work for some odd reason
            } else {
                for (let term of terms) {
                    if (term.channel === channel.replace('#', '')) {
                        let regex = new RegExp(term.regex, 'gi');
                        if (regex.test(message)) {
                            if (term.response.includes('{newline}')) {
                                let msgs = term.response.split('{newline}');
                                for (let msg of msgs) {
                                    chatClient.say(channel, msg.replace('{user}', user));
                                }
                            } else {
                                chatClient.say(channel, term.response.replace('{user}', user));
                            }
                        }
                    }
                }
            }
        });

        Afk.find().then(async (afks) => {
            for (let afk of afks) {
                if (afk.user === user) {
                    let time = new Date(afk.timestamp);
                    switch (afk.status) {
                        case Status.AFK:
                            chatClient.say(
                                channel,
                                `${user} is no longer afk: ${(await banphraseCheck(afk.message, channel)) ? '[Banphrased]' : afk.message} (${prettyTime(Date.now() - time.getTime())} ago)`
                            );
                            break;

                        case Status.LURK:
                            chatClient.say(
                                channel,
                                `${user} is no longer lurking: ${(await banphraseCheck(afk.message, channel)) ? '[Banphrased]' : afk.message} (${prettyTime(Date.now() - time.getTime())} ago)`
                            );
                            break;

                        case Status.SLEEP:
                            chatClient.say(
                                channel,
                                `${user} just woke up: ${(await banphraseCheck(afk.message, channel)) ? '[Banphrased]' : afk.message} (${prettyTime(Date.now() - time.getTime())} ago)`
                            );
                            break;
                    }
                    await Afk.findByIdAndDelete(afk._id);
                }
            }
        });

        CustomCommand.find().then(async (c: ICustomCommand[]) => {
            c = c.filter(async (c: ICustomCommand) => c.channel === channel.replace('#', ''));
            for (let customCommand of c) {
                let customArgs = message.toLowerCase().split(' ');
                if (customCommand.command.toLowerCase() === customArgs[0]) {
                    let onCooldown = false;

                    let userCooldownData = await redis.get(`customcooldown:${customCommand.command}:${channel}:${user}`);
                    if (userCooldownData) onCooldown = true;

                    let channelCooldownData = await redis.get(`customcooldown:${customCommand.command}:${channel}`);
                    if (channelCooldownData) onCooldown = true;
                    if (!onCooldown) {
                        await redis.set(`customcooldown:${customCommand.command}:${channel}:${user}`, Date.now(), 'EX', customCommand.userCooldown);
                        await redis.set(`customcooldown:${customCommand.command}:${channel}`, Date.now(), 'EX', customCommand.channelCooldown);

                        let urlToFetch = customCommand.response.replace(/^.+\$fetchURL\(|\).+$/g, '');
                        if (urlToFetch !== customCommand.response) {
                            try {
                                console.log(urlToFetch);
                                let resp = await axios.get(urlToFetch, {
                                    timeout: 10000,
                                });
                                let commandResponse = customCommand.response;
                                chatClient.say(channel, commandResponse.replace(`$fetchURL(${urlToFetch})`, resp.data));
                            } catch (err) {
                                chatClient.say(channel, `Error while fetching: ${urlToFetch}`);
                            }
                        } else {
                            chatClient.say(channel, customCommand.response);
                        }
                    }
                }
            }
        });

        let userReminders: string[] = [];
        let disabledCommands: any = await redis.get(`disabledcommands:${channel.replace('#', '')}`);
        if (disabledCommands) {
            disabledCommands = JSON.parse(disabledCommands);
            if (disabledCommands.disabled.indexOf('remind') > -1) {
                //
            } else {
                Reminder.find().then(async (reminders) => {
                    for (let reminder of reminders) {
                        if (reminder.username === user) {
                            let time = new Date(reminder.timestamp);
                            if (banphraseCheck(`${reminder.message}`, channel)) {
                                userReminders.push(`${reminder.author}: [Banphrased - this reminder hasn't been deleted in the database] (${prettyTime(Date.now() - time.getTime())} ago)`);
                            } else {
                                userReminders.push(`${reminder.author}: ${reminder.message} (${prettyTime(Date.now() - time.getTime())} ago)`);

                                Reminder.findByIdAndDelete(reminder._id).then(() => {
                                    console.log(`Deleted reminder for ${user}`);
                                });
                            }
                        }
                    }
                    let reminderArr = chunkArr(userReminders, 450);
                    for (let reminder of reminderArr) {
                        chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                    }
                });
            }
        } else {
            Reminder.find().then(async (reminders) => {
                for (let reminder of reminders) {
                    if (reminder.username === user) {
                        let time = new Date(reminder.timestamp);
                        if (banphraseCheck(`${reminder.message}`, channel)) {
                            userReminders.push(`${reminder.author}: [Banphrased - this reminder hasn't been deleted in the database] (${prettyTime(Date.now() - time.getTime())} ago)`);
                        } else {
                            userReminders.push(`${reminder.author}: ${reminder.message} (${prettyTime(Date.now() - time.getTime())} ago)`);
                            Reminder.findByIdAndDelete(reminder._id).then(() => {
                                console.log(`Deleted reminder for ${user}`);
                            });
                        }
                    }
                }
                let reminderArr = chunkArr(userReminders, 450);
                for (let reminder of reminderArr) {
                    chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                }
            });
        }

        // WHO NEEDS CACHING ANYWAYS LUL
        /* 
        let reminderCache: any = await redis.get(`cache:MONGODBREMINDERS`);
        if (reminderCache) {
            reminderCache = JSON.parse(reminderCache);
        } else {
            let allReminders: { _id: any; username: String; message: String; timestamp: Date; author: String }[] = [];
            Reminder.find().then((reminders) => {
                for (let reminder of reminders) {
                    allReminders.push({
                        _id: reminder._id,
                        username: reminder.username,
                        message: reminder.message,
                        timestamp: reminder.timestamp,
                        author: reminder.author,
                    });
                }
            });
            reminderCache = allReminders;
            await redis.set(`cache:MONGODBREMINDERS`, JSON.stringify(allReminders), 'EX', 5);
        }
        
        console.log(reminderCache, 'dank');
        */

        if (message.startsWith(config.prefix)) {
            let cmdmsg = message.substring(config.prefix.length).split(' ');
            const cmd = cmdmsg[0];
            const args = cmdmsg.slice(1);
            let _cmds = commands;

            let targetCmd: string = cmd;
            _cmds.forEach((c: Command) => {
                if (c.aliases) {
                    if (c.aliases.indexOf(cmd) > -1) {
                        targetCmd = c.name;
                    }
                }
            });

            if (_cmds.get(targetCmd)) {
                const command: Command = commands.get(targetCmd);
                console.log(command);

                async function handleCooldown() {
                    if (!command?.userCooldown) return true;
                    if (!command?.channelCooldown) return true;

                    let userCooldownData = await redis.get(`cooldown:${command.name}:${channel}:${user}`);
                    if (userCooldownData) return false;

                    let channelCooldownData = await redis.get(`cooldown:${command.name}:${channel}`);
                    if (channelCooldownData) return false;

                    await redis.set(`cooldown:${command.name}:${channel}:${user}`, Date.now(), 'EX', command.userCooldown);
                    await redis.set(`cooldown:${command.name}:${channel}`, Date.now(), 'EX', command.channelCooldown);

                    return true;
                }

                async function executeCommand() {
                    if (await handleCooldown()) {
                        // Check if the command is disabled
                        let disabledCommands: any = await redis.get(`disabledcommands:${channel.replace('#', '')}`);
                        if (disabledCommands) {
                            disabledCommands = JSON.parse(disabledCommands);
                            if (disabledCommands.disabled.indexOf(targetCmd) > -1) {
                                return chatClient.say(channel, `@${user}, this command has been disabled by the broadcaster!`);
                            }
                        }

                        command
                            .execute(user, channel, args, cmd)
                            .then(async (data: CommandReturnClass) => {
                                console.table(data);
                                if (data.success) {
                                    if (data.message) {
                                        chatClient.say(
                                            channel,
                                            `${data.noping ? '' : `@${user}, `}${
                                                data?.ignorebanphrase ? data.message : (await banphraseCheck(data.message, channel)) ? 'Command result is banphrased' : data.message
                                            }`
                                        );
                                    }
                                } else {
                                    chatClient.say(channel, `@${user}, command unsucessful: ${data?.message ? data.message : data.error}`);
                                }
                            })
                            .catch(async (err) => {
                                if (process.env.DEBUG === 'TRUE') {
                                    chatClient.say(channel, `@${user}, error while executing command. Check the debug console...`);
                                    return console.error(err);
                                }
                                error(err, ['Error while executing command:', user, channel, command.name]);
                                let errorID = await createNewError(channel, user, message, command.name, err.toString());
                                chatClient.say(
                                    channel,
                                    `@${user}, there was an unknown error while executing the command. You should report this with the ?suggest command. Include the error ID and how you used the command. Error ID: ${errorID}`
                                );
                            });
                    }
                }

                if (command.permission) {
                    if (hasPermisison(command.permission, user, channel, msg)) {
                        executeCommand();
                    } else if (!command?.hidden) {
                        chatClient.say(channel, `@${user}, you do not have permission to use this command!`);
                    }
                } else {
                    executeCommand();
                }
            }
        }
    });

    function hasPermisison(requiredPermission: PermissionEnum, user: string, channel: string, msg: any): boolean {
        if (requiredPermission === PermissionEnum.Developer) {
            if (user === config.owner) {
                return true;
            } else {
                return false;
            }
        }

        if (requiredPermission === PermissionEnum.Broadcaster) {
            if (msg.userInfo.isBroadcaster) {
                return true;
            } else if (user === config.owner) {
                return true;
            } else {
                return false;
            }
        }

        if (requiredPermission === PermissionEnum.Moderator) {
            if (msg.userInfo.isMod) {
                return true;
            } else if (msg.userInfo.isBroadcaster) {
                return true;
            } else if (user === config.owner) {
                return true;
            } else {
                return false;
            }
        }

        if (requiredPermission === PermissionEnum.VIP) {
            if (msg.userInfo.isVip) {
                return true;
            } else if (msg.userInfo.isMod) {
                return true;
            } else if (msg.userInfo.isBroadcaster) {
                return true;
            } else if (user === config.owner) {
                return true;
            } else {
                return false;
            }
        }

        if (requiredPermission === PermissionEnum.Subscriber) {
            if (msg.userInfo.isSubscriber) {
                return true;
            } else if (msg.userInfo.isMod) {
                return true;
            } else if (msg.userInfo.isBroadcaster) {
                return true;
            } else if (user === config.owner) {
                return true;
            } else {
                return false;
            }
        }
    }

    await chatClient.connect();
    console.log(`Client connected!`);
}
main();

export async function banphraseCheck(msgToCheck: string, channel: string): Promise<boolean> {
    let modules = await Module.find();
    for (let module of modules) {
        if (module.channel === channel.replace('#', '')) {
            if (module.module === moduleEnum.ASCII) {
                if (msgToCheck.match(ASCII_REGEX)?.length > 5) {
                    return true;
                }
            } else if (module.module === moduleEnum.LINKS) {
                if (getUrls(msgToCheck).size > 0) {
                    return true;
                }
            }
        }
    }

    let terms = await Term.find();
    for (let term of terms) {
        if (term.channel === channel.replace('#', '')) {
            let regex = new RegExp(term.regex, 'gi');
            if (regex.test(msgToCheck)) {
                return true;
            }
        }
    }

    return false;
}
