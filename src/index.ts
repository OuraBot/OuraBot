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
import { chunkArr, obfuscateName } from './utils/stringManipulation.js';
import { CustomCommand, ICustomCommand } from './models/command.model.js';
import axios from 'axios';
import { Afk, IAfk, Status } from './models/afk.model.js';
import { Term } from './models/term.model.js';
import { Module } from './models/module.model.js';
import { moduleEnum } from './commands/modmodule.js';
import getUrls from 'get-urls';
import { ISub, Sub } from './models/sub.model.js';
import { unescapeHTML } from './commands/ddoi.js';
import EventSource = require('eventsource');
import { createServer } from 'http';
import createHandler = require('github-webhook-handler');

const WEEB_REGEX =
    /\b(CuteAnimeFeet|muniDANK|muniClap|muniJam|muniPat|muniSit|muniSweat|muniSip|muniHug|muniPrime|muniWave|muniShy|muniHYPERS|muniBless|muniAww|muniREE|muniLurk|muniPout|muniSmug|muniWeird|muniWow|muniStare|muniYawn|muniCry|muniFlower|muniLUL|muniComfy|muniNotes|muniBonk|muniW|forsenPuke[0-5]*|naroSpeedL|naroDerping|naroAAAAA|naroDance|naroSpeedR|naroOh|naroFumo|naroSmug|naroSlain|naroBless|naroReally|naroHodo|naroBlush|naro2hu|naroLove|naroWo|naroStaryn|naroWOW|naroSalute|naroEh|naroSad|naroDesu|naroScared|naroWhat|naroEhehe|naroGasm|naroThug|naroDerp|naroRage|naroYay|naroXD|naroDX|xqcAYAYA|xqcLewd|xqcNom|happythoDinkDonk|happythoNod|happythoLove|happythoLurk|happythoNoted|happythoCrumpet|happythoShroom|happythoExcited|happytho7|happythoRee|happythoCross|happythoBonk|happythoBoop|happythoFacepalm|happythoGiggle|happythoGimmie|happythoNoBully|happythoWoah|happythoThumbsUp|happythoThumbsDown|happythoBlessed|happythoEvil|happythoCute|happythoNom|happythoShock|happythoSweat|happythoRIP|happythoPat|happythoSleepy|happythoNotLikeThis|happythoLUL|happythoWeird|happythoCry|happythoSilly|happythoKiss|happythoHug|happythoThink|happythoShy|happythoShrug|happythoPout|happythoHyper|happythoStare|happythoWave|happythoSip|happythoComfy|happythoSus|happythoRich|happythoSmile|happythoTuck|TPFufun|TehePelo|OiMinna|AYAYA|CuteAnimeFeetasleepyRainy|asleepyJAMMER|asleepyLoves|asleepyWaves|asleepyBrows|asleepyZOOM|asleepyRiot|asleepyWoah|asleepyUWU|asleepyThink|asleepyStab|asleepySad|asleepyREE|asleepyPat|asleepyLost|asleepyL|asleepyKiss|asleepyKEK|asleepyGib|asleepyDetective|asleepyComfy|asleepyClown|asleepyAYAYA|asleepyAww|asleepyHehe|asleepyLove|asleepyPlead|asleepyYes|asleepyWave|asleepyOMEGALUL|asleepyShy|asleepyLurk|asleepyHYPERS|asleepySip|asleepyFine|asleepyDevil|asleepyAngel|asleepyAngy|asleepySquish|asleepyBlob|asleepyISee|asleepyWow|asleepyHNGmendo7|mendoRage|mendoE|mendoLewd|mendoRIP|mendo4|mendo3|mendoWow|mendo2|mendo1|mendoClown|mendoThumb|mendoS|mendoWave|mendoUWU|mendoT|mendoBlind|mendoSmug|mendoSleepy|mendoHuh|mendoHands|mendoShrug|mendoFail|mendoB|mendoPeek|mendoGun|mendoU|mendoPantsu|mendoEZ|mendoDab|mendoLUL|mendoCry|mendoREE|mendoL|mendoKoda|mendoBark|mendoSip|mendoHug|mendoWink|mendoPat|mendoComfy|mendoDerp|mendoBanger|mendoM|mendoBlush|mendoAYAYA|mendoGasm|mendoH|mendoHypers|mendoFine)/g;
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
const handler = createHandler({ path: '/wh', secret: 'nNJ9M}x|?#8$2(5aAaT?xSQ:rV^h{->s7:_TQ4t!>AGE0#Q]-W=)b+?}~^G-,Nr5' });

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

    // check every hour
    setInterval(async () => {
        // Check if DDOI has posted a new video
        try {
            let video: any = await axios.get(`https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBE_KEY}&channelId=UCdC0An4ZPNr_YiFiYoVbwaw&part=snippet,id&order=date&maxResults=1`);
            video = await video.data.items[0];
            let redisData: any = await redis.get('DDOI-LATEST');
            if (redisData) {
                if (video.id.videoId !== redisData) {
                    await new Reminder({
                        username: 'elpws',
                        message: `New video from DDOI: ${unescapeHTML(video.snippet.title)} - https://www.youtube.com/watch?v=${video.id.videoId}`,
                        timestamp: new Date(),
                        author: 'SYSTEM',
                    }).save();
                    await redis.set('DDOI-LATEST', video.id.videoId);
                }
            } else {
                redis.set('DDOI-LATEST', video.id.videoId);
            }
        } catch (err) {
            console.log(err);
            error('DDOI Hourly Video Error', [err]);
            createNewError('null', 'DDOI HOURLY VIDEO', 'null', 'null', err.toString() + '\n' + err.stack);
        }
    }, 1000 * 60 * 60);

    interface EmoteEventUpdate {
        // The channel this update affects.
        channel: string;
        // The ID of the emote.
        emote_id: string;
        // The name or channel alias of the emote.
        name: string;
        // The action done.
        action: 'ADD' | 'REMOVE' | 'UPDATE';
        // The user who caused this event to trigger.
        actor: string;
        // An emote object. Null if the action is "REMOVE".
        emote?: ExtraEmoteData;
    }

    interface ExtraEmoteData {
        // Original name of the emote.
        name: string;
        // The visibility bitfield of this emote.
        visibility: number;
        // The MIME type of the images.
        mime: string;
        // The TAGs on this emote.
        tags: string[];
        // The widths of the images.
        width: [number, number, number, number];
        // The heights of the images.
        height: [number, number, number, number];
        // The animation status of the emote.
        animated: boolean;
        // Infomation about the uploader.
        owner: {
            // 7TV ID of the owner.
            id: string;
            // Twitch ID of the owner.
            twitch_id: string;
            // Twitch DisplayName of the owner.
            display_name: string;
            // Twitch Login of the owner.
            login: string;
        };
    }

    let sevenTVSource = new EventSource('https://events.7tv.app/v1/channel-emotes?channel=auror6s&channel=elpws&channel=elpwsbot');

    add7TVListeners(sevenTVSource);

    setInterval(() => {
        sevenTVSource.close();
        sevenTVSource = new EventSource('https://events.7tv.app/v1/channel-emotes?channel=auror6s&channel=elpws&channel=elpwsbot');
        add7TVListeners(sevenTVSource);
    }, 1000 * 60 * 60);

    function add7TVListeners(source: EventSource) {
        // prettier-ignore
        source.addEventListener('ready', (e: any) => {
                // Should be "7tv-event-sub.v1" since this is the `v1` endpoint
                console.log(e.data);
            });

        // prettier-ignore
        source.addEventListener('update', (e: any) => {
                let emoteData: EmoteEventUpdate = JSON.parse(e.data);
                console.log(emoteData);
                switch(emoteData.action) {
                    case 'ADD':
                        chatClient.say(emoteData.channel, `New 7\u{E0000}TV emote has been added: ${emoteData.name}`)
                    break;
    
                    case 'REMOVE':
                        chatClient.say(emoteData.channel, `7TV Emote: ${emoteData.name} has been removed`)
                    break;
    
                    case 'UPDATE':
                        chatClient.say(emoteData.channel, `7TV Emote: ${emoteData.emote.name} has been aliased to ${emoteData.name}`);
                    break;
                    
                }
            });

        // prettier-ignore
        source.addEventListener('open', (e: any) => {
                // Connection was opened.
            });

        // prettier-ignore
        source.addEventListener('error', async (e: any) => {
                if (e.readyState === EventSource.CLOSED) {
                    source.close();
                    source = new EventSource('https://events.7tv.app/v1/channel-emotes?channel=auror6s&channel=elpws&channel=elpwsbot');
                } else {
                    source = new EventSource('https://events.7tv.app/v1/channel-emotes?channel=auror6s&channel=elpws&channel=elpwsbot');
                }
            });
    }

    createServer(function (req, res) {
        handler(req, res, function (err) {
            res.statusCode = 404;
            res.end('no such location');
        });
    }).listen(process.env.PORT || 8081);

    handler.on('error', function (err) {
        console.error('Error:', err.message);
    });

    handler.on('push', function (event) {
        if (event.payload.repository.name === 'Twitch-Bot') {
            if (event.payload.head_commit.message.includes('PRIVATE')) {
                chatClient.say('#auror6s', `NotSureDank New Hidden OuraBot commit by ${obfuscateName(event.payload.pusher.name)} on branch: ${event.payload.ref.replace('refs/heads/', '')}`);
            } else {
                chatClient.say(
                    '#auror6s',
                    `ppHop New OuraBot commit by ${obfuscateName(event.payload.pusher.name)}: "${event.payload.head_commit.message}" on branch: ${event.payload.ref.replace('refs/heads/', '')}`
                );
            }
        }
    });

    chatClient.onNotice((target, user, message, msg) => {
        if (msg.tagsToString() === 'msg-id=msg_rejected_mandatory') {
            chatClient.say(target, `A message that was about to be posted violates this channel's moderation settings.`);
        }
    });

    chatClient.onJoin((channel, user) => {
        console.log(`${user} joined ${channel}`);

        if (channel === '#auror6s') chatClient.say('auror6s', `PagMan v2 BOT CONNECTED ${process.env.DEBUG === 'TRUE' ? 'IN DEBUG MODE' : ''}`);
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
                                chatClient.say(channel, `/timeout ${user} ${module.timeout} Link in message`);
                            }
                        } else if (module.module === moduleEnum.WEEB) {
                            if (message.match(WEEB_REGEX)) {
                                let redisData: string | number = await redis.get(`WEEB:${channel}:${user}`);
                                if (redisData) {
                                    redisData = Number(redisData);
                                    let nextLen = redisData * 2;
                                    await chatClient.say(channel, `/timeout ${user} ${redisData} WEEB Mod Module (next timeout will be ${nextLen}s)`);
                                    await redis.set(`WEEB:${channel}:${user}`, nextLen, 'EX', 3600);
                                    return;
                                } else {
                                    await redis.set(`WEEB:${channel}:${user}`, module.timeout * 2, 'EX', 3600);
                                    await chatClient.say(channel, `/timeout ${user} ${module.timeout} WEEB Mod Module (next timeout will be ${module.timeout * 2}s)`);
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
                                    chatClient.say(channel, msg.replace(/{user}/g, user));
                                }
                            } else {
                                chatClient.say(channel, term.response.replace(/{user}/g, user));
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
            for (let customCommand of c) {
                if (customCommand.channel === channel.replace('#', '')) {
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
                                    chatClient.say(
                                        channel,
                                        commandResponse
                                            .replace(`$fetchURL(${urlToFetch})`, resp.data)
                                            .replace(/{user}/g, user)
                                            .replace(/{channel}/g, channel)
                                    );
                                } catch (err) {
                                    chatClient.say(channel, `Error while fetching: ${urlToFetch}`);
                                }
                            } else {
                                if (customCommand.response.match(/(GET|INCR){[A-z]{4,10}}/g)) {
                                    let countKey = /(GET|INCR)({[A-z]{4,10}})/g.exec(customCommand.response)[2].replace(/({|})/g, '');
                                    let redisData = await redis.get(`COUNT:${channel}:${countKey}`);
                                    if (redisData) {
                                        if (customCommand.response.match(/GET{[A-z]{4,10}}/g)) {
                                            let countValue = Number(redisData);
                                            chatClient.say(channel, customCommand.response.replace(/GET{[A-z]{4,10}}/g, `${countValue}`));
                                        } else {
                                            await redis.incr(`COUNT:${channel}:${countKey}`);
                                            let countValue = Number(redisData);
                                            chatClient.say(channel, customCommand.response.replace(/INCR{[A-z]{4,10}}/g, `${countValue + 1}`));
                                        }
                                    } else {
                                        if (customCommand.response.match(/GET{[A-z]{4,10}}/g)) {
                                            await redis.set(`COUNT:${channel}:${countKey}`, 0);
                                            chatClient.say(channel, customCommand.response.replace(/GET{[A-z]{4,10}}/g, '0'));
                                        } else {
                                            await redis.set(`COUNT:${channel}:${countKey}`, 1);
                                            chatClient.say(channel, customCommand.response.replace(/INCR{[A-z]{4,10}}/g, '1'));
                                        }
                                    }
                                } else {
                                    chatClient.say(channel, customCommand.response.replace(/{user}/g, user).replace(/{channel}/g, channel));
                                }
                            }
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
                            if (reminder.author === 'SYSTEM') {
                                userReminders.push(`${reminder.author}: ${reminder.message} (${prettyTime(Date.now() - time.getTime())} ago)`);
                                Reminder.findByIdAndDelete(reminder._id).then(() => {
                                    console.log(`Deleted reminder for ${user}`);
                                });
                            } else {
                                if (!(await banphraseCheck(`${reminder.message}`, channel))) {
                                    userReminders.push(`${reminder.author}: ${reminder.message} (${prettyTime(Date.now() - time.getTime())} ago)`);
                                    Reminder.findByIdAndDelete(reminder._id).then(() => {
                                        console.log(`Deleted reminder for ${user}`);
                                    });
                                }
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
                        if (reminder.author === 'SYSTEM') {
                            userReminders.push(`${reminder.author}: ${reminder.message} (${prettyTime(Date.now() - time.getTime())} ago)`);
                            Reminder.findByIdAndDelete(reminder._id).then(() => {
                                console.log(`Deleted reminder for ${user}`);
                            });
                        } else {
                            if (!(await banphraseCheck(`${reminder.message}`, channel))) {
                                userReminders.push(`${reminder.author}: ${reminder.message} (${prettyTime(Date.now() - time.getTime())} ago)`);
                                Reminder.findByIdAndDelete(reminder._id).then(() => {
                                    console.log(`Deleted reminder for ${user}`);
                                });
                            }
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
                                let errorID = await createNewError(channel, user, message, command.name, err.toString() + '\n' + err.stack);
                                chatClient.say(
                                    channel,
                                    `@${user}, there was an unknown error while executing the command. You should report this with the !suggest command. Include the error ID and how you used the command. Error ID: ${errorID}`
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

    chatClient.onStandardPayForward(async (channel, user, forwardInfo, msg) => {
        let subResp: ISub = (await Sub.find()).filter((s) => s.channel === channel.replace('#', ''))[0];
        if (!subResp) return;

        if (forwardInfo?.originalGifterDisplayName) {
            chatClient.say(channel, subResp['onStandardPayForward_gifted'].replace('${displayName}', forwardInfo.displayName).replace('${gifterName}', forwardInfo.originalGifterDisplayName));
        } else {
            chatClient.say(channel, subResp['onStandardPayForward_anon'].replace('${displayName}', forwardInfo.displayName));
        }
    });

    chatClient.onSub(async (channel, user, subInfo, msg) => {
        let subResp: ISub = (await Sub.find()).filter((s) => s.channel === channel.replace('#', ''))[0];
        if (!subResp) return;
        // chatClient.say(subResp);

        if (subInfo.isPrime) {
            chatClient.say(channel, subResp['onSub_primeNew'].replace('${displayName}', subInfo.displayName).replace('${planName}', subInfo.planName));
        } else {
            if (subInfo.plan === '1000') {
                chatClient.say(channel, subResp['onSub_tierOneNew'].replace('${displayName}', subInfo.displayName).replace('${planName}', subInfo.planName));
            } else if (subInfo.plan === '2000') {
                chatClient.say(channel, subResp['onSub_tierTwoNew'].replace('${displayName}', subInfo.displayName).replace('${planName}', subInfo.planName));
            } else if (subInfo.plan === '3000') {
                chatClient.say(channel, subResp['onSub_tierThreeNew'].replace('${displayName}', subInfo.displayName).replace('${planName}', subInfo.planName));
            }
        }
    });

    chatClient.onResub(async (channel, user, subInfo, msg) => {
        let subResp: ISub = (await Sub.find()).filter((s) => s.channel === channel.replace('#', ''))[0];
        if (!subResp) return;

        if (subInfo.isPrime) {
            if (subInfo?.streak) {
                // prettier-ignore
                chatClient.say(channel, subResp['onResub_primeStreak'].replace('${displayName}', subInfo.displayName).replace('${months}', `${subInfo.months}`).replace('${streak}', `${subInfo.streak}`).replace('${planName}', subInfo.planName))
            } else {
                // prettier-ignore
                chatClient.say(channel, subResp['onResub_prime'].replace('${displayName}', subInfo.displayName).replace('${months}', `${subInfo.months}`).replace('${planName}', subInfo.planName))
            }
        } else {
            if (subInfo.plan === '1000') {
                if (subInfo?.streak) {
                    // prettier-ignore
                    chatClient.say(channel, subResp['onResub_oneStreak'].replace('${displayName}', subInfo.displayName).replace('${months}', `${subInfo.months}`).replace('${streak}', `${subInfo.streak}`).replace('${planName}', subInfo.planName))
                } else {
                    // prettier-ignore
                    chatClient.say(channel, subResp['onResub_one'].replace('${displayName}', subInfo.displayName).replace('${months}', `${subInfo.months}`).replace('${planName}', subInfo.planName))
                }
            } else if (subInfo.plan === '2000') {
                if (subInfo?.streak) {
                    // prettier-ignore
                    chatClient.say(channel, subResp['onResub_twoStreak'].replace('${displayName}', subInfo.displayName).replace('${months}', `${subInfo.months}`).replace('${streak}', `${subInfo.streak}`).replace('${planName}', subInfo.planName))
                } else {
                    // prettier-ignore
                    chatClient.say(channel, subResp['onResub_two'].replace('${displayName}', subInfo.displayName).replace('${months}', `${subInfo.months}`).replace('${planName}', subInfo.planName))
                }
            } else if (subInfo.plan === '3000') {
                if (subInfo?.streak) {
                    // prettier-ignore
                    chatClient.say(channel, subResp['onResub_threeStreak'].replace('${displayName}', subInfo.displayName).replace('${months}', `${subInfo.months}`).replace('${streak}', `${subInfo.streak}`).replace('${planName}', subInfo.planName))
                } else {
                    // prettier-ignore
                    chatClient.say(channel, subResp['onResub_three'].replace('${displayName}', subInfo.displayName).replace('${months}', `${subInfo.months}`).replace('${planName}', subInfo.planName))
                }
            }
        }
    });

    chatClient.onSubExtend(async (channel, user, subInfo, msg) => {
        let subResp: ISub = (await Sub.find()).filter((s) => s.channel === channel.replace('#', ''))[0];
        if (!subResp) return;

        chatClient.say(channel, subResp['onSubExtend'].replace('${displayName}', subInfo.displayName).replace('${months}', `${subInfo.months}`));
    });

    chatClient.onSubGift(async (channel, user, subInfo, msg) => {
        let subResp: ISub = (await Sub.find()).filter((s) => s.channel === channel.replace('#', ''))[0];
        if (!subResp) return;

        if (subInfo?.gifterDisplayName) {
            if (subInfo?.streak) {
                chatClient.say(
                    channel,
                    subResp['onSubGift_gifted']
                        .replace('${displayName}', subInfo.displayName)
                        .replace('${planName}', subInfo.planName)
                        .replace('${gifterName}', subInfo.gifterDisplayName)
                        .replace('${months}', `${subInfo.months}`)
                );
            } else {
                chatClient.say(
                    channel,
                    subResp['onSubGift_gifted']
                        .replace('${displayName}', subInfo.displayName)
                        .replace('${planName}', subInfo.planName)
                        .replace('${gifterName}', subInfo.gifterDisplayName)
                        .replace('${months}', `${subInfo.months}`)
                );
            }
        } else {
            if (subInfo?.streak) {
                // prettier-ignore
                chatClient.say(
                    channel,
                    subResp['onSubGift_anon']
                        .replace('${displayName}', subInfo.displayName)
                        .replace('${planName}', subInfo.planName)
                        .replace('${months}', `${subInfo.months}`)
                );
            } else {
                // prettier-ignore
                chatClient.say(
                    channel,
                    subResp['onSubGift_anon']
                        .replace('${displayName}', subInfo.displayName)
                        .replace('${planName}', subInfo.planName)
                        .replace('${months}', `${subInfo.months}`)
                );
            }
        }
    });

    chatClient.onGiftPaidUpgrade(async (channel, user, subInfo, msg) => {
        let subResp: ISub = (await Sub.find()).filter((s) => s.channel === channel.replace('#', ''))[0];
        if (!subResp) return;

        if (subInfo?.gifterDisplayName) {
            // prettier-ignore
            chatClient.say(channel,
                subResp['giftPaidUpgrade_gifted']
                .replace('${displayName}', subInfo.displayName)
                .replace('${gifterName}', subInfo.gifterDisplayName)
                );
        } else {
            // prettier-ignore
            chatClient.say(channel,
                subResp['giftPaidUpgrade_gifted']
                .replace('${displayName}', subInfo.displayName)
                );
        }
    });

    chatClient.onPrimePaidUpgrade(async (channel, user, subInfo, msg) => {
        let subResp: ISub = (await Sub.find()).filter((s) => s.channel === channel.replace('#', ''))[0];
        if (!subResp) return;

        chatClient.say(channel, subResp['onPrimePaidUpgrade'].replace('${displayName}', subInfo.displayName));
    });

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
            } else if (module.module === moduleEnum.WEEB) {
                if (msgToCheck.match(WEEB_REGEX)) {
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

process.on('unhandledRejection', (reason, p) => {
    error(`Unhandled Rejection: ${reason} | ${p}`);
});
