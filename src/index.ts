import { ApiClient } from '@twurple/api';
import { AccessToken, ClientCredentialsAuthProvider, RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient, Whisper } from '@twurple/chat';
import axios from 'axios';
import chalk from 'chalk';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import getUrls from 'get-urls';
import { createServer } from 'http';
import Redis from 'ioredis';
import mongoose from 'mongoose';
import { unescapeHTML } from './commands/ddoi.js';
import { moduleEnum } from './commands/modmodule.js';
import { Afk, IAfk, Status } from './models/afk.model.js';
import { Channel, IChannel } from './models/channel.model';
import { CustomCommand, ICustomCommand } from './models/command.model.js';
import { IModule, Module } from './models/module.model.js';
import { IReminder, Reminder } from './models/reminder.model.js';
import { ISub, Sub } from './models/sub.model.js';
import { ITerm, Term } from './models/term.model.js';
import { logCommandUse } from './models/usage.model';
import { CustomModule, getModules } from './types/custommodule.js';
import { checkPajbotBanphrase } from './utils/apis/banphrases';
import { prettyTime } from './utils/auroMs';
import { Command, CommandReturnClass, getCommands, hasPermisison } from './utils/commandClass.js';
import { getConfig } from './utils/config.js';
import { fetchBots } from './utils/knownBots.js';
import { ILogLevel, Logger } from './utils/logger.js';
import { chunkArr, obfuscateName, sanitizeMessage } from './utils/stringManipulation.js';
import EventSource = require('eventsource');
import createHandler = require('github-webhook-handler');

export const WEEB_REGEX =
    /\b(SilverLove|SilverMelt|SilverCozy|SilverLurk|SilverHeadpat|SilverHug|SilverHype|SilverRaid|SilverREE|SilverWave|SilverYandere|SilverCry|SilverZoom|SilverSuffer|SilverWow|SilverPout|SilverPOG|SilverBlush|SilverAyaya|SilverDerp|SilverD|SilverAwoo|SilverDorime|SilverFacepalm|SilverGift|SilverGimmeL|SilverGimmeR|SilverGun|SilverHuh|SilverJam|SilverRIP|SilverShrug|SilverSip|SilverSleepy|SilverSmug|SilverStress|SilverThink|SilverYikes|SilverLUL|SilverWat|SilverScared|SilverHypers|SilverDisgust|SilverDone|SilverPlead|SilverQueen|SilverPeace|SilverThumbsUp|SilverSweat|SilverNoU|SilverWolf1|SilverWolf2|SilverWolf3|SilverMamaHug|SilverMamaLove|SilverMamaKisses|SilverMamaCrab|CuteAnimeFeet|muniDANK|muniClap|muniJam|muniPat|muniSit|muniSweat|muniSip|muniHug|muniPrime|muniWave|muniShy|muniHYPERS|muniBless|muniAww|muniREE|muniLurk|muniPout|muniSmug|muniWeird|muniWow|muniStare|muniYawn|muniCry|muniFlower|muniLUL|muniComfy|muniNotes|muniBonk|muniW|forsenPuke[0-5]*|naroSpeedL|naroDerping|naroAAAAA|naroDance|naroSpeedR|naroOh|naroFumo|naroSmug|naroSlain|naroBless|naroReally|naroHodo|naroBlush|naro2hu|naroLove|naroWo|naroStaryn|naroWOW|naroSalute|naroEh|naroSad|naroDesu|naroScared|naroWhat|naroEhehe|naroGasm|naroThug|naroDerp|naroRage|naroYay|naroXD|naroDX|xqcAYAYA|xqcLewd|xqcNom|happythoDinkDonk|happythoNod|happythoLove|happythoLurk|happythoNoted|happythoCrumpet|happythoShroom|happythoExcited|happytho7|happythoRee|happythoCross|happythoBonk|happythoBoop|happythoFacepalm|happythoGiggle|happythoGimmie|happythoNoBully|happythoWoah|happythoThumbsUp|happythoThumbsDown|happythoBlessed|happythoEvil|happythoCute|happythoNom|happythoShock|happythoSweat|happythoRIP|happythoPat|happythoSleepy|happythoNotLikeThis|happythoLUL|happythoWeird|happythoCry|happythoSilly|happythoKiss|happythoHug|happythoThink|happythoShy|happythoShrug|happythoPout|happythoHyper|happythoStare|happythoWave|happythoSip|happythoComfy|happythoSus|happythoRich|happythoSmile|happythoTuck|TPFufun|TehePelo|OiMinna|AYAYA|CuteAnimeFeetasleepyRainy|asleepyJAMMER|asleepyLoves|asleepyWaves|asleepyBrows|asleepyZOOM|asleepyRiot|asleepyWoah|asleepyUWU|asleepyThink|asleepyStab|asleepySad|asleepyREE|asleepyPat|asleepyLost|asleepyL|asleepyKiss|asleepyKEK|asleepyGib|asleepyDetective|asleepyComfy|asleepyClown|asleepyAYAYA|asleepyAww|asleepyHehe|asleepyLove|asleepyPlead|asleepyYes|asleepyWave|asleepyOMEGALUL|asleepyShy|asleepyLurk|asleepyHYPERS|asleepySip|asleepyFine|asleepyDevil|asleepyAngel|asleepyAngy|asleepySquish|asleepyBlob|asleepyISee|asleepyWow|asleepyHNGmendo7|mendoRage|mendoE|mendoLewd|mendoRIP|mendo4|mendo3|mendoWow|mendo2|mendo1|mendoClown|mendoThumb|mendoS|mendoWave|mendoUWU|mendoT|mendoBlind|mendoSmug|mendoSleepy|mendoHuh|mendoHands|mendoShrug|mendoFail|mendoB|mendoPeek|mendoGun|mendoU|mendoPantsu|mendoEZ|mendoDab|mendoLUL|mendoCry|mendoREE|mendoL|mendoKoda|mendoBark|mendoSip|mendoHug|mendoWink|mendoPat|mendoComfy|mendoDerp|mendoBanger|mendoM|mendoBlush|mendoAYAYA|mendoGasm|mendoH|mendoHypers|mendoFine)/g;
const ASCII_REGEX =
    /([─│┌┐└┘├┤┬┴┼═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬╤╥▀▄█▌▐░▒▓■□▪▫▬▲►▼◄⠁⠂⠄⠈⠐⠠⡀⢀⠃⠅⠉⠑⠡⡁⢁⠆⠊⠒⠢⡂⢂⠌⠔⠤⡄⢄⠘⠨⡈⢈⠰⡐⢐⡠⢠⣀⠇⠋⠓⠣⡃⢃⠍⠕⠥⡅⢅⠙⠩⡉⢉⠱⡑⢑⡡⢡⣁⠎⠖⠦⡆⢆⠚⠪⡊⢊⠲⡒⢒⡢⢢⣂⠜⠬⡌⢌⠴⡔⢔⡤⢤⣄⠸⡘⢘⡨⢨⣈⡰⢰⣐⣠⠏⠗⠧⡇⢇⠛⠫⡋⢋⠳⡓⢓⡣⢣⣃⠝⠭⡍⢍⠵⡕⢕⡥⢥⣅⠹⡙⢙⡩⢩⣉⡱⢱⣑⣡⠞⠮⡎⢎⠶⡖⢖⡦⢦⣆⠺⡚⢚⡪⢪⣊⡲⢲⣒⣢⠼⡜⢜⡬⢬⣌⡴⢴⣔⣤⡸⢸⣘⣨⣰⠟⠯⡏⢏⠷⡗⢗⡧⢧⣇⠻⡛⢛⡫⢫⣋⡳⢳⣓⣣⠽⡝⢝⡭⢭⣍⡵⢵⣕⣥⡹⢹⣙⣩⣱⠾⡞⢞⡮⢮⣎⡶⢶⣖⣦⡺⢺⣚⣪⣲⡼⢼⣜⣬⣴⣸⠿⡟⢟⡯⢯⣏⡷⢷⣗⣧⡻⢻⣛⣫⣳⡽⢽⣝⣭⣵⣹⡾⢾⣞⣮⣶⣺⣼⡿⢿⣟⣯⣷⣻⣽⣾⣿⠀]{5,})/gim;

dotenv.config();

export const config = getConfig();
// const apiTokens = getAPITokens();
// const TMITokens = getTMITokens();

export const redis = new Redis();

const maxSpamClients = 10;

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

export let commands = getCommands();
export function refreshCommands() {
    commands = getCommands();
}
const handler = createHandler({ path: '/wh', secret: 'nNJ9M}x|?#8$2(5aAaT?xSQ:rV^h{->s7:_TQ4t!>AGE0#Q]-W=)b+?}~^G-,Nr5' });

export let chatClient: ChatClient;
export let apiClient: ApiClient;
export let apiClient2: ApiClient;
export let sevenTVSource: EventSource;
export let badSites: Set<string>;
export const logger: Logger = new Logger(ILogLevel.WARN);

// TODO: put this model in a separate file
export interface NukeMessage {
    channel: string;
    message: string;
    user: string;
    cantTimeout: boolean;
    sentAt: Number;
}

export let spamClients: ChatClient[] = [];

export let nukeMessages: NukeMessage[] = [];

export let commitHash: string;
export let commitMessage: string;
export let commitAuthor: string;
export let commitDate: string;
export let branch: string;
export let commitCount: number;

async function main(): Promise<void> {
    commitHash = execSync('git rev-parse HEAD').toString().trim();
    commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
    commitAuthor = execSync('git log -1 --pretty=%an').toString().trim();
    commitDate = execSync('git log -1 --pretty=%ad').toString().trim();
    branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    commitCount = parseInt(execSync('git rev-list --count HEAD').toString().trim());

    // log with the git info and chalk
    console.log(
        `Oura_Bot starting on commit ${chalk.bold(commitHash.substr(0, 7))} by ${chalk.bold(commitAuthor)} on ${chalk.bold(commitDate)} on branch ${chalk.bold(branch)} ${
            process.env.DEBUG === 'TRUE' ? `${chalk.inverse('IN DEBUG MODE')}` : ''
        }`
    );

    const clientId = process.env.APP_CLIENTID;
    //  ['clips:edit', 'chat:read', 'chat:edit', 'channel:moderate']
    const clientSecret = process.env.APP_SECRET;
    const tokenData: AccessToken = JSON.parse(await fs.readFile('./tokens.json', 'utf-8'));
    const auth = new RefreshingAuthProvider(
        {
            clientId,
            clientSecret,
            onRefresh: async (newTokenData) => await fs.writeFile('./tokens.json', JSON.stringify(newTokenData, null, 4), 'utf-8'),
        },
        tokenData
    );

    const authProvider: ClientCredentialsAuthProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
    apiClient = new ApiClient({ authProvider });
    apiClient2 = new ApiClient({ authProvider: auth });

    mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    let nukeMessagesCache = await redis.get(`ob:nukemessagescache`);
    if (nukeMessagesCache) {
        nukeMessages = JSON.parse(nukeMessagesCache);
    }

    /*
        Clueless TeaTime mongodb error incident of 10/8/2021
        Clueless TeaTime 600 errors in 5 seconds
        Clueless TeaTime recursive error handling
        Clueless Teatime temp ip ban from discord
        https://i.mrauro.dev/l3nf5.png
        https://i.mrauro.dev/FL5Og.png
    */

    // check if mongoose is connected every 5 seconds and if not throw an error
    setInterval(() => {
        // check if mongoose.connection.readyState is 1 or 2
        if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
            axios.post(process.env.DISCORD_WEBHOOK, {
                embeds: [
                    {
                        title: `OuraBot :: MONGO NOT CONNECTED!`,
                        description: `MONGO IS NOT CONNECTED! ${mongoose.connection.readyState}`,
                        color: 16711680,
                        timestamp: new Date(),
                    },
                ],
            });
            mongoose.connect(process.env.MONGO_URL, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
        }
    }, 5000);

    const channels: IChannel[] = await Channel.find();
    const sortedChannels = channels
        .sort((a: any, b: any) => {
            if (!a.priority && !b.priority) {
                return 0;
            }
            if (!a.priority) {
                return 1;
            }
            if (!b.priority) {
                return -1;
            }

            return a.priority - b.priority;
        })
        .map((c) => c.channel);

    const initialChannels = sortedChannels.slice(0, 199);
    const remainingChannels = sortedChannels.slice(199);

    chatClient = new ChatClient(
        process.env.DEBUG === 'TRUE'
            ? {
                  authProvider: auth,
                  channels: config.tmi.channels,
                  botLevel: 'verified',
                  isAlwaysMod: true,
              }
            : {
                  authProvider: auth,
                  channels: initialChannels,
                  botLevel: 'verified',
                  isAlwaysMod: true,
              }
    );

    Promise.all(
        [...Array(maxSpamClients)].map(async (_, i) => {
            spamClients[i] = new ChatClient({
                authProvider: auth,
                channels: [config.owner],
                botLevel: 'verified',
                isAlwaysMod: true,
            });
            spamClients[i].connect();
        })
    );

    await fetchBots();

    const badSiteData = await axios.get('https://raw.githubusercontent.com/elbkr/bad-websites/main/websites.json');
    badSites = new Set(badSiteData.data);

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
            logger.error(err, 'DDOI Hourly Video Error');
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

    let eventApiChannels = JSON.parse(await redis.get(`ob:7tveventapichannels`));

    sevenTVSource = new EventSource(`https://events.7tv.app/v1/channel-emotes?${eventApiChannels.map((c: string) => `channel=${c}`).join('&')}`);

    add7TVListeners(sevenTVSource);

    setInterval(() => {
        restart7TVEventApi();
    }, 1000 * 60 * 60);

    setInterval(async () => {
        console.log('checking to refresh');
        let newChannels = JSON.parse(await redis.get(`ob:7tveventapichannels`));
        if (JSON.stringify(newChannels) !== JSON.stringify(eventApiChannels)) {
            console.log('refreshing eventapi');
            eventApiChannels = newChannels;
            restart7TVEventApi();
        }
    }, 1000 * 60 * 1);

    async function restart7TVEventApi() {
        sevenTVSource.close();
        eventApiChannels = JSON.parse(await redis.get(`ob:7tveventapichannels`));
        sevenTVSource = new EventSource(`https://events.7tv.app/v1/channel-emotes?${eventApiChannels.map((c: string) => `channel=${c}`).join('&')}`);
        add7TVListeners(sevenTVSource);
    }

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
                    restart7TVEventApi()
                } else { 
                    restart7TVEventApi()
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
        logger.error(err, 'Error in GitHub HTTP server');
    });

    handler.on('push', function (event) {
        try {
            if (event.payload.repository.name === 'Twitch-Bot') {
                if (event.payload.head_commit.message.includes('PRIVATE')) {
                    chatClient.say(config.owner, `NotSureDank New Hidden OuraBot commit by ${obfuscateName(event.payload.pusher.name)} on branch: ${event.payload.ref.replace('refs/heads/', '')}`);
                } else {
                    chatClient.say(
                        config.owner,
                        `ppHop New OuraBot commit by ${obfuscateName(event.payload.pusher.name)}: "${event.payload.head_commit.message}" on branch: ${event.payload.ref.replace('refs/heads/', '')}`
                    );
                }
            }
        } catch (err) {
            console.log(err, event);
        }
    });

    chatClient.onNotice((target, user, message, msg) => {
        console.log(`${new Date().toISOString()} NOTICE ${target} ${user} ${message} ${msg.rawLine}`);
        if (msg.tagsToString() === 'msg-id=msg_rejected_mandatory') {
            chatClient.say(target, `A message that was about to be posted violates this channel's moderation settings.`);
        }
    });

    chatClient.onJoin((channel, user) => {
        console.log(`${user} joined ${channel}`);

        if (channel === `#${config.owner}`) {
            let dateSinceCommit = prettyTime(new Date().getTime() - new Date(commitDate).getTime(), false);
            chatClient.say(channel, `/color dodgerblue`);

            chatClient.say(
                `#${config.owner}`,
                `PagMan v2 BOT CONNECTED ${process.env.DEBUG === 'TRUE' ? 'IN DEBUG MODE' : ''} on  ${branch}@${commitHash.substr(0, 7)} by ${obfuscateName(
                    commitAuthor
                )} (${dateSinceCommit} ago): ${commitMessage
                    .split('\n')
                    .filter((n) => n)
                    .join(' - ')}`
            );
        }
    });

    chatClient.onWhisper((user: string, message: string, msg: Whisper) => {
        if (user === config.owner) {
            try {
                let args = message.split(' ');
                const channel = args[1].replace('#', '');
                switch (args[0]) {
                    case '!filesayfast':
                        if (args[2].match(/^https:\/\/(haste\.zneix\.eu\/|hastebin\.com\/|pastebin\.com\/)raw\/.+$/)) {
                            axios.get(args[2]).then(async (response: any) => {
                                let msgs = response.data.split('\n');
                                for (let msg of msgs) {
                                    await chatClient.say(channel, msg);
                                }
                            });
                        }
                        break;

                    case '!filesayslow':
                        if (args[2].match(/^https:\/\/(haste\.zneix\.eu\/|hastebin\.com\/|pastebin\.com\/)raw\/.+$/)) {
                            axios.get(args[2]).then(async (response: any) => {
                                let msgs = response.data.split('\n');
                                for (let msg of msgs) {
                                    await new Promise((resolve) => setTimeout(resolve, 1200));
                                    await chatClient.say(channel, msg);
                                }
                            });
                        }
                        break;
                }
            } catch (err) {
                console.log(err, 'whispered');
            }
        }
    });

    let commands = await getCommands();
    let custommodules = await getModules();
    chatClient.onMessage(async (channel, user, message, msg) => {
        // console.log(`${new Date().toISOString()} PRIVMSG ${channel} :${message}`);

        nukeMessages.push({
            channel: channel,
            user: user,
            message: message,
            cantTimeout: msg.userInfo.isMod || msg.userInfo.isBroadcaster,
            sentAt: Date.now(),
        });

        // Remove old nuke messages older than 30 minutes
        // o(n) time complexity so shouldn't be a problem
        for (let i = 0; i < nukeMessages.length; i++) {
            if (nukeMessages[i].sentAt < Date.now() - 1000 * 60 * 30) {
                nukeMessages.splice(i, 1);
            }
        }

        redis.get(`tl:${channel}:module`).then(async (redisData) => {
            if (redisData) {
                const modules: IModule[] = JSON.parse(redisData);
                for (let module of modules) {
                    // module.ignorepermissions
                    if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
                        // Using '!' before the msg.userInfo doesn't work for some odd reason... 😕
                    } else {
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
                            }
                            if (module.module === moduleEnum.LINKS) {
                                if (getUrls(message).size > 0) {
                                    chatClient.say(channel, `/timeout ${user} ${module.timeout} Link in message`);
                                }
                            }
                            if (module.module === moduleEnum.WEEB) {
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
                            if (module.module === moduleEnum.BIGFOLLOWS) {
                                if (message.includes('cutt.ly')) {
                                    let urls = getUrls(message);
                                    for (let url of urls) {
                                        let urlData = await axios.get(`https://unshorten.me/json/${url}`);
                                        if (urlData.data.resolved_url.includes('bigfollows')) {
                                            chatClient.say(config.owner, `${user} has a bigfollows link in ${obfuscateName(channel)}`);
                                            chatClient.say(channel, `/ban ${user} Bigfollows link detected in message`);
                                            return;
                                        }
                                    }
                                }
                            }
                            if (module.module === moduleEnum.BADLINKS) {
                                let urls = getUrls(message);
                                for (let url of urls) {
                                    if (badSites.has(url)) {
                                        chatClient.say(channel, `/ban ${user} URL detected in message is on known Bad URLs list`);
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                Module.find().then(async (modules) => {
                    redis.set(`tl:${channel}:module`, JSON.stringify(modules), 'EX', 5);
                    for (let module of modules) {
                        if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
                            // Using '!' before the msg.userInfo doesn't work for some odd reason... 😕
                        } else {
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
                                }
                                if (module.module === moduleEnum.LINKS) {
                                    if (getUrls(message).size > 0) {
                                        chatClient.say(channel, `/timeout ${user} ${module.timeout} Link in message`);
                                    }
                                }
                                if (module.module === moduleEnum.WEEB) {
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
                                if (module.module === moduleEnum.BIGFOLLOWS) {
                                    if (message.includes('cutt.ly')) {
                                        let urls = getUrls(message);
                                        for (let url of urls) {
                                            let urlData = await axios.get(`https://unshorten.me/json/${url}`);
                                            if (urlData.data.resolved_url.includes('bigfollows')) {
                                                chatClient.say(channel, `/ban ${user} Bigfollows link detected in message`);
                                                chatClient.say(config.owner, `@${config.owner}, ${user} has a bigfollows link in ${obfuscateName(channel)}`);
                                                return;
                                            }
                                        }
                                    }
                                }
                                if (module.module === moduleEnum.BADLINKS) {
                                    let urls = getUrls(message);
                                    for (let url of urls) {
                                        if (badSites.has(url)) {
                                            chatClient.say(channel, `/ban ${user} URL detected in message is on known Bad URLs list`);
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            }
        });

        redis.get(`tl:${channel}:term`).then(async (redisData) => {
            if (redisData) {
                const terms: ITerm[] = JSON.parse(redisData);
                for (let term of terms) {
                    if (term.ignorepermissions) {
                        if (term.channel === channel.replace('#', '')) {
                            let regex = new RegExp(term.regex, 'gi');
                            if (regex.test(message)) {
                                if (term.response.includes('{newline}')) {
                                    if ((await chatClient.getMods(channel)).includes(process.env.CLIENT_USERNAME) || (await chatClient.getVips(channel)).includes(process.env.CLIENT_USERNAME)) {
                                        let msgs = term.response.split('{newline}');
                                        for (let msg of msgs) {
                                            chatClient.say(channel, sanitizeMessage(msg.replace(/{user}/g, user)));
                                        }
                                    } else {
                                        chatClient.say(channel, `A custom command was triggered but I am not a moderator or a VIP`);
                                    }
                                } else {
                                    chatClient.say(channel, sanitizeMessage(term.response.replace(/{user}/g, user)));
                                }
                            }
                        }
                    } else {
                        if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
                            // Using '!' before the msg.userInfo doesn't work for some odd reason... 😕
                        } else {
                            if (term.channel === channel.replace('#', '')) {
                                let regex = new RegExp(term.regex, 'gi');
                                if (regex.test(message)) {
                                    if (term.response.includes('{newline}')) {
                                        if ((await chatClient.getMods(channel)).includes(process.env.CLIENT_USERNAME)) {
                                            let msgs = term.response.split('{newline}');
                                            for (let msg of msgs) {
                                                chatClient.say(channel, sanitizeMessage(msg.replace(/{user}/g, user)));
                                            }
                                        } else {
                                            chatClient.say(channel, `A custom command was triggered but I am not a moderator or a VIP`);
                                        }
                                    } else {
                                        chatClient.say(channel, sanitizeMessage(term.response.replace(/{user}/g, user)));
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                Term.find().then(async (terms: ITerm[]) => {
                    redis.set(`tl:${channel}:term`, JSON.stringify(terms), 'EX', 5);
                    for (let term of terms) {
                        if (term.ignorepermissions) {
                            if (term.channel === channel.replace('#', '')) {
                                let regex = new RegExp(term.regex, 'gi');
                                if (regex.test(message)) {
                                    if (term.response.includes('{newline}')) {
                                        if ((await chatClient.getMods(channel)).includes(process.env.CLIENT_USERNAME)) {
                                            let msgs = term.response.split('{newline}');
                                            for (let msg of msgs) {
                                                chatClient.say(channel, sanitizeMessage(msg.replace(/{user}/g, user)));
                                            }
                                        } else {
                                            chatClient.say(channel, `A moderation term was triggered but I do not have moderator permissions`);
                                        }
                                    } else {
                                        chatClient.say(channel, sanitizeMessage(term.response.replace(/{user}/g, user)));
                                    }
                                }
                            }
                        } else {
                            if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
                                // Using '!' before the msg.userInfo doesn't work for some odd reason... 😕
                            } else {
                                if (term.channel === channel.replace('#', '')) {
                                    let regex = new RegExp(term.regex, 'gi');
                                    if (regex.test(message)) {
                                        if (term.response.includes('{newline}')) {
                                            if ((await chatClient.getMods(channel)).includes(process.env.CLIENT_USERNAME)) {
                                                let msgs = term.response.split('{newline}');
                                                for (let msg of msgs) {
                                                    chatClient.say(channel, sanitizeMessage(msg.replace(/{user}/g, user)));
                                                }
                                            } else {
                                                chatClient.say(channel, `A moderation term was triggered but I do not have moderator permissions`);
                                            }
                                        } else {
                                            chatClient.say(channel, sanitizeMessage(term.response.replace(/{user}/g, user)));
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            }
        });

        custommodules.forEach((m: CustomModule) => {
            if (m.channels.includes(channel)) {
                if (m.enabled != false) m.execute(channel, user, message, msg, chatClient, redis);
            }
        });

        redis.get(`tl:${channel}:afk`).then(async (redisData) => {
            if (redisData) {
                const afks: IAfk[] = JSON.parse(redisData);
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

                            case Status.EATING:
                                chatClient.say(
                                    channel,
                                    `${user} is no longer eating: ${(await banphraseCheck(afk.message, channel)) ? '[Banphrased]' : afk.message} (${prettyTime(Date.now() - time.getTime())} ago)`
                                );
                                break;
                        }
                        await Afk.findByIdAndDelete(afk._id);
                        redis.del(`tl:${channel}:afk`);
                    }
                }
            } else {
                Afk.find().then(async (afks) => {
                    redis.set(`tl:${channel}:afk`, JSON.stringify(afks), 'EX', 5);
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

                                case Status.EATING:
                                    chatClient.say(
                                        channel,
                                        `${user} is no longer eating: ${(await banphraseCheck(afk.message, channel)) ? '[Banphrased]' : afk.message} (${prettyTime(Date.now() - time.getTime())} ago)`
                                    );
                                    break;
                            }
                            await Afk.findByIdAndDelete(afk._id);
                            redis.del(`tl:${channel}:afk`);
                        }
                    }
                });
            }
        });

        redis.get(`tl:${channel}:customcommands`).then(async (redisData) => {
            if (redisData) {
                let c: ICustomCommand[] = JSON.parse(redisData);
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

                                if (customCommand.response.match(/(GET|INCR){[A-z]{4,10}}/g)) {
                                    let countKey = /(GET|INCR)({[A-z]{4,10}})/g.exec(customCommand.response)[2].replace(/({|})/g, '');
                                    let redisData = await redis.get(`COUNT:${channel}:${countKey}`);
                                    if (redisData) {
                                        if (customCommand.response.match(/GET{[A-z]{4,10}}/g)) {
                                            let countValue = Number(redisData);
                                            chatClient.say(channel, sanitizeMessage(customCommand.response.replace(/GET{[A-z]{4,10}}/g, `${countValue}`)));
                                        } else {
                                            await redis.incr(`COUNT:${channel}:${countKey}`);
                                            let countValue = Number(redisData);
                                            chatClient.say(channel, sanitizeMessage(customCommand.response.replace(/INCR{[A-z]{4,10}}/g, `${countValue + 1}`)));
                                        }
                                    } else {
                                        if (customCommand.response.match(/GET{[A-z]{4,10}}/g)) {
                                            await redis.set(`COUNT:${channel}:${countKey}`, 0);
                                            chatClient.say(channel, sanitizeMessage(customCommand.response.replace(/GET{[A-z]{4,10}}/g, '0')));
                                        } else {
                                            await redis.set(`COUNT:${channel}:${countKey}`, 1);
                                            chatClient.say(channel, sanitizeMessage(customCommand.response.replace(/INCR{[A-z]{4,10}}/g, '1')));
                                        }
                                    }
                                } else {
                                    if (customCommand.response.match(/^REPEAT\([0-9]{1,3}\)\s/)) {
                                        let repeatCount = Number(customCommand.response.match(/^REPEAT\(([0-9]{1,3})\)\s/)[1]);
                                        let response = customCommand.response.replace(/^REPEAT\([0-9]{1,3}\)\s/, '');
                                        if ((await chatClient.getMods(channel)).includes(process.env.CLIENT_USERNAME) || (await chatClient.getVips(channel)).includes(process.env.CLIENT_USERNAME)) {
                                            for (let i = 0; i < repeatCount && i < 150; i++) {
                                                await new Promise((resolve) => setTimeout(resolve, 500));
                                                chatClient.say(channel, sanitizeMessage(response));
                                            }
                                        } else {
                                            chatClient.say(channel, `A custom command was triggered but I am not a moderator or a VIP`);
                                        }
                                    } else {
                                        chatClient.say(channel, sanitizeMessage(customCommand.response.replace(/{user}/g, user).replace(/{channel}/g, channel.replace('#', ''))));
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                CustomCommand.find().then(async (c: ICustomCommand[]) => {
                    redis.set(`tl:${channel}:customcommands`, JSON.stringify(c), 'EX', 5);
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

                                    if (customCommand.response.match(/(GET|INCR){[A-z]{4,10}}/g)) {
                                        let countKey = /(GET|INCR)({[A-z]{4,10}})/g.exec(customCommand.response)[2].replace(/({|})/g, '');
                                        let redisData = await redis.get(`COUNT:${channel}:${countKey}`);
                                        if (redisData) {
                                            if (customCommand.response.match(/GET{[A-z]{4,10}}/g)) {
                                                let countValue = Number(redisData);
                                                chatClient.say(channel, sanitizeMessage(customCommand.response.replace(/GET{[A-z]{4,10}}/g, `${countValue}`)));
                                            } else {
                                                await redis.incr(`COUNT:${channel}:${countKey}`);
                                                let countValue = Number(redisData);
                                                chatClient.say(channel, sanitizeMessage(customCommand.response.replace(/INCR{[A-z]{4,10}}/g, `${countValue + 1}`)));
                                            }
                                        } else {
                                            if (customCommand.response.match(/GET{[A-z]{4,10}}/g)) {
                                                await redis.set(`COUNT:${channel}:${countKey}`, 0);
                                                chatClient.say(channel, sanitizeMessage(customCommand.response.replace(/GET{[A-z]{4,10}}/g, '0')));
                                            } else {
                                                await redis.set(`COUNT:${channel}:${countKey}`, 1);
                                                chatClient.say(channel, sanitizeMessage(customCommand.response.replace(/INCR{[A-z]{4,10}}/g, '1')));
                                            }
                                        }
                                    } else {
                                        if (customCommand.response.match(/^REPEAT\([0-9]{1,3}\)\s/)) {
                                            let repeatCount = Number(customCommand.response.match(/^REPEAT\(([0-9]{1,3})\)\s/)[1]);
                                            let response = customCommand.response.replace(/^REPEAT\([0-9]{1,3}\)\s/, '');
                                            if (
                                                (await chatClient.getMods(channel)).includes(process.env.CLIENT_USERNAME) ||
                                                (await chatClient.getVips(channel)).includes(process.env.CLIENT_USERNAME)
                                            ) {
                                                for (let i = 0; i < repeatCount && i < 150; i++) {
                                                    await new Promise((resolve) => setTimeout(resolve, 500));
                                                    chatClient.say(channel, sanitizeMessage(response));
                                                }
                                            } else {
                                                chatClient.say(channel, `A custom command was triggered but I am not a moderator or a VIP`);
                                            }
                                        } else {
                                            chatClient.say(channel, sanitizeMessage(customCommand.response.replace(/{user}/g, user).replace(/{channel}/g, channel.replace('#', ''))));
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            }
        });

        let userReminders: string[] = [];
        let disabledCommands: any = await redis.get(`disabledcommands:${channel.replace('#', '')}`);
        if (disabledCommands) {
            disabledCommands = JSON.parse(disabledCommands);
            if (disabledCommands.disabled.indexOf('remind') > -1) {
                //
            } else {
                redis.get(`tl:${channel}:reminders`).then(async (redisData) => {
                    if (redisData) {
                        let reminders: IReminder[] = JSON.parse(redisData);
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
                        if (reminderArr.length >= 2) {
                            if ((await chatClient.getMods(channel)).includes(process.env.CLIENT_USERNAME) || (await chatClient.getVips(channel)).includes(process.env.CLIENT_USERNAME)) {
                                for (let reminder of reminderArr) {
                                    chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                                }
                            } else {
                                for (let reminder of reminderArr) {
                                    chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                                    await new Promise((resolve) => setTimeout(resolve, 1100));
                                }
                            }
                        } else {
                            for (let reminder of reminderArr) {
                                chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                            }
                        }
                    } else {
                        Reminder.find().then(async (reminders) => {
                            redis.set(`tl:${channel}:reminders`, JSON.stringify(reminders), 'EX', 5);
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
                            if (reminderArr.length >= 2) {
                                if ((await chatClient.getMods(channel)).includes(process.env.CLIENT_USERNAME) || (await chatClient.getVips(channel)).includes(process.env.CLIENT_USERNAME)) {
                                    for (let reminder of reminderArr) {
                                        chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                                    }
                                } else {
                                    for (let reminder of reminderArr) {
                                        chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                                        await new Promise((resolve) => setTimeout(resolve, 1100));
                                    }
                                }
                            } else {
                                for (let reminder of reminderArr) {
                                    chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                                }
                            }
                        });
                    }
                });
            }
        } else {
            redis.get(`tl:${channel}:reminders`).then(async (redisData) => {
                if (redisData) {
                    let reminders: IReminder[] = JSON.parse(redisData);
                    for (let reminder of reminders) {
                        if (reminder.username === user) {
                            let time = new Date(reminder.timestamp);
                            if (reminder.author === 'SYSTEM') {
                                userReminders.push(`${reminder.author}: ${reminder.message} (${prettyTime(Date.now() - time.getTime())} ago)`);
                                Reminder.findByIdAndDelete(reminder._id).then(() => {
                                    console.log(`Deleted reminder for ${user}`);
                                    redis.del(`tl:${channel}:reminders`);
                                });
                            } else {
                                if (!(await banphraseCheck(`${reminder.message}`, channel))) {
                                    userReminders.push(`${reminder.author}: ${reminder.message} (${prettyTime(Date.now() - time.getTime())} ago)`);
                                    Reminder.findByIdAndDelete(reminder._id).then(() => {
                                        console.log(`Deleted reminder for ${user}`);
                                        redis.del(`tl:${channel}:reminders`);
                                    });
                                }
                            }
                        }
                    }
                    let reminderArr = chunkArr(userReminders, 450);
                    if (reminderArr.length >= 2) {
                        if ((await chatClient.getMods(channel)).includes(process.env.CLIENT_USERNAME) || (await chatClient.getVips(channel)).includes(process.env.CLIENT_USERNAME)) {
                            for (let reminder of reminderArr) {
                                chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                            }
                        } else {
                            for (let reminder of reminderArr) {
                                chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                                await new Promise((resolve) => setTimeout(resolve, 1100));
                            }
                        }
                    } else {
                        for (let reminder of reminderArr) {
                            chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                        }
                    }
                } else {
                    Reminder.find().then(async (reminders) => {
                        redis.set(`tl:${channel}:reminders`, JSON.stringify(reminders), 'EX', 5);
                        for (let reminder of reminders) {
                            if (reminder.username === user) {
                                let time = new Date(reminder.timestamp);
                                if (reminder.author === 'SYSTEM') {
                                    userReminders.push(`${reminder.author}: ${reminder.message} (${prettyTime(Date.now() - time.getTime())} ago)`);
                                    Reminder.findByIdAndDelete(reminder._id).then(() => {
                                        console.log(`Deleted reminder for ${user}`);
                                    });
                                    redis.del(`tl:${channel}:reminders`);
                                } else {
                                    if (!(await banphraseCheck(`${reminder.message}`, channel))) {
                                        userReminders.push(`${reminder.author}: ${reminder.message} (${prettyTime(Date.now() - time.getTime())} ago)`);
                                        Reminder.findByIdAndDelete(reminder._id).then(() => {
                                            console.log(`Deleted reminder for ${user}`);
                                        });
                                        redis.del(`tl:${channel}:reminders`);
                                    }
                                }
                            }
                        }
                        let reminderArr = chunkArr(userReminders, 450);
                        if (reminderArr.length >= 2) {
                            if ((await chatClient.getMods(channel)).includes(process.env.CLIENT_USERNAME) || (await chatClient.getVips(channel)).includes(process.env.CLIENT_USERNAME)) {
                                for (let reminder of reminderArr) {
                                    chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                                }
                            } else {
                                for (let reminder of reminderArr) {
                                    chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                                    await new Promise((resolve) => setTimeout(resolve, 1100));
                                }
                            }
                        } else {
                            for (let reminder of reminderArr) {
                                chatClient.say(channel, `@${user}, reminders - ${reminder}`);
                            }
                        }
                    });
                }
            });
        }

        let channelPrefix = await redis.get(`ob:${channel}:prefix`);
        if (channelPrefix) {
            channelPrefix = channelPrefix;
        } else {
            channelPrefix = process.env.DEBUG === 'TRUE' ? config.debugprefix : config.prefix;
        }

        // This is a bad way of doing this, but i can't think of a better way to do it
        if (message.startsWith(`!ping`)) {
            const pingCommand: Command = commands.get('ping');

            if (await handleCooldown()) {
                pingCommand.execute(user, channel, []).then((data: CommandReturnClass) => {
                    chatClient.say(channel, `${data.noping ? '' : `@${user}, `} ${data.message}`);
                });
                return;
            } else {
                return;
            }

            async function handleCooldown(): Promise<Boolean> {
                if (!pingCommand?.userCooldown) return true;
                if (!pingCommand?.channelCooldown) return true;

                let userCooldownData = await redis.get(`cooldown:${pingCommand.name}:${channel}:${user}`);
                if (userCooldownData) return false;

                let channelCooldownData = await redis.get(`cooldown:${pingCommand.name}:${channel}`);
                if (channelCooldownData) return false;

                await redis.set(`cooldown:${pingCommand.name}:${channel}:${user}`, Date.now(), 'EX', pingCommand.userCooldown);
                await redis.set(`cooldown:${pingCommand.name}:${channel}`, Date.now(), 'EX', pingCommand.channelCooldown);

                return true;
            }
        }

        if (message.startsWith(channelPrefix)) {
            let cmdmsg = message.substring(channelPrefix.length).split(' ');
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
                            if (disabledCommands.disabled.indexOf(targetCmd) > -1) return;
                        }

                        if (
                            command.requireFastLimits &&
                            !((await chatClient.getMods(channel)).includes(process.env.CLIENT_USERNAME) || (await chatClient.getVips(channel)).includes(process.env.CLIENT_USERNAME))
                        ) {
                            return chatClient.say(channel, `@${user}, I need to be a VIP or a moderator to execute this command!`);
                        }

                        if (command.requiresMod && !(await chatClient.getMods(channel)).includes(process.env.CLIENT_USERNAME)) {
                            return chatClient.say(channel, `@${user}, I need to be a moderator to execute this command!`);
                        }

                        command
                            .execute(user, channel, args, cmd, msg)
                            .then(async (data: CommandReturnClass) => {
                                console.table(data);
                                if (data.success) {
                                    if (data.message) {
                                        if (Array.isArray(data.message)) {
                                            for (let m of data.message) {
                                                if (process.env?.DEBUG !== 'TRUE')
                                                    logCommandUse(
                                                        user,
                                                        channel,
                                                        command.name,
                                                        data.success,
                                                        args,
                                                        `${data.noping ? '' : `@${user}, `}${data?.ignorebanphrase ? m : (await banphraseCheck(m, channel)) ? 'Command result is banphrased' : m}`
                                                    );
                                                chatClient.say(
                                                    channel,
                                                    `${data.noping ? '' : `@${user}, `}${data?.ignorebanphrase ? m : (await banphraseCheck(m, channel)) ? 'Command result is banphrased' : m}`
                                                );
                                            }
                                        } else {
                                            if (process.env?.DEBUG !== 'TRUE')
                                                logCommandUse(
                                                    user,
                                                    channel,
                                                    command.name,
                                                    data.success,
                                                    args,
                                                    `${data.noping ? '' : `@${user}, `}${
                                                        data?.ignorebanphrase ? data.message : (await banphraseCheck(data.message, channel)) ? 'Command result is banphrased' : data.message
                                                    }`
                                                );
                                            chatClient.say(
                                                channel,
                                                `${data.noping ? '' : `@${user}, `}${
                                                    data?.ignorebanphrase ? data.message : (await banphraseCheck(data.message, channel)) ? 'Command result is banphrased' : data.message
                                                }`
                                            );
                                        }
                                    }
                                } else {
                                    if (data.reducedcooldown) {
                                        if (data.reducedcooldown == 0) {
                                            redis.del(`cooldown:${command.name}:${channel}`);
                                            redis.del(`cooldown:${command.name}:${channel}:${user}`);
                                        } else {
                                            redis.set(`cooldown:${command.name}:${channel}`, Date.now(), 'EX', data.reducedcooldown);
                                            redis.set(`cooldown:${command.name}:${channel}:${user}`, Date.now(), 'EX', data.reducedcooldown);
                                        }
                                    }
                                    if (process.env?.DEBUG !== 'TRUE')
                                        logCommandUse(user, channel, command.name, data.success, args, `@${user}, command unsucessful: ${data?.message ? data.message : data.error}`);
                                    chatClient.say(channel, `@${user}, command unsucessful: ${data?.message ? data.message : data.error}`);
                                }
                            })
                            .catch(async (err) => {
                                if (process.env.DEBUG === 'TRUE') {
                                    chatClient.say(channel, `@${user}, error while executing command. Check the debug console...`);
                                    return console.error(err);
                                }
                                if (err?.status == 503) {
                                    let errorID = await logger.error(err, channel, user, message, command.name);
                                    if (process.env?.DEBUG !== 'TRUE')
                                        logCommandUse(
                                            user,
                                            channel,
                                            command.name,
                                            false,
                                            args,
                                            `@${user}, the requsted service is unavailable (503). Twitch server's might be having problems. Error ID: ${errorID}`
                                        );

                                    chatClient.say(channel, `@${user}, the requsted service is unavailable (503). Twitch server's might be having problems. Error ID: ${errorID}`);
                                } else {
                                    let errorID = await logger.error(err, channel, user, message, command.name);
                                    if (process.env?.DEBUG !== 'TRUE')
                                        logCommandUse(user, channel, command.name, false, args, `@${user}, there was an unknown error while executing the command. Error ID: ${errorID}`);
                                    chatClient.say(channel, `@${user}, there was an unknown error while executing the command. Error ID: ${errorID}`);
                                }
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

    await chatClient.connect().then(async () => {
        console.log(`Client connected to intial channels`);
        await new Promise((resolve) => setTimeout(resolve, 30e3));
        for (const chnl of remainingChannels) {
            chatClient.join(chnl);
            await new Promise((r) => setTimeout(r, 300));
        }
    });
    console.log(`Client connected to all channels`);
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
            }

            if (module.module === moduleEnum.LINKS) {
                if (getUrls(msgToCheck).size > 0) {
                    return true;
                }
            }

            if (module.module === moduleEnum.WEEB) {
                if (msgToCheck.match(WEEB_REGEX)) {
                    return true;
                }
            }

            if (module.module === moduleEnum.BIGFOLLOWS) {
                if (msgToCheck.includes('cutt.ly')) {
                    let urls = getUrls(msgToCheck);
                    for (let url of urls) {
                        let urlData = await axios.get(`https://unshorten.me/json/${url}`);
                        if (urlData.data.resolved_url.includes('bigfollows')) {
                            return true;
                        }
                    }
                }
            }

            if (module.module === moduleEnum.BADLINKS) {
                let urls = getUrls(msgToCheck);
                for (let url of urls) {
                    if (badSites.has(url)) {
                        return true;
                    }
                }
            }
        }
    }

    if (await checkPajbotBanphrase(msgToCheck, channel)) return true;

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

if (process.env.DEBUG === 'TRUE') {
} else {
    process.on('unhandledRejection', (error: Error) => {
        logger.error(error, 'Unhandled Rejection');
    });
}

process.on('SIGINT', async () => {
    await redis.set(`ob:nukemessagescache`, JSON.stringify(nukeMessages));
    process.exit(0);
});
