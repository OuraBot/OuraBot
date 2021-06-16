import { RefreshableAuthProvider, StaticAuthProvider, ClientCredentialsAuthProvider } from 'twitch-auth';
import { ChatClient, ChatUser, ClearChat } from 'twitch-chat-client';
import { promises as fs } from 'fs';
import { ApiClient, Subscription, UserChatInfo } from 'twitch';
import { EventSubListener } from 'twitch-eventsub';
import { NgrokAdapter } from 'twitch-eventsub-ngrok';

import { inspect } from 'util';
import { exec } from 'child_process';
import moment from 'moment';
import ms from 'ms';
import axios from 'axios';
import Discord, { Channel } from 'discord.js';
import * as auroMs from 'auro-ms-conversion';
import sourceURL from './Util/leppunen.js';
import getBestEmote from './Util/bae.js';

import clientCommands from '../commands.json';
import clientConfig from '../config.json';

import * as dotenv from 'dotenv';
dotenv.config();

const internalAPI = process.env.INTERNALAPI || 'http://10.0.0.97:5000';

let highestQualityClip;
let commandCacheData = [];
let commandCacheTimer = 0;
const onCooldown = new Set();
const customOnCooldown = new Set();
const _onCooldown = new Set();

// followunke days limit
const MAX_DAYS_TO_CALLBACK = 3;

// clip wait time
const TIME_TO_WAIT_CLIP = 5000;

async function main() {
    console.log(`${process.env.CLIENT_USERNAME} is starting...`);
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

    const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
    const apiClient = new ApiClient({ authProvider });
    const apiClient2 = new ApiClient({ authProvider: auth });
    await apiClient.helix.eventSub.deleteAllSubscriptions();
    const listener = new EventSubListener(apiClient, new NgrokAdapter(), 'AURO-OURABOT-cde93bd0-2683-4aec-b743-06dd461d9b8e');
    await listener.listen();

    const listenResp = await axios.get(`${internalAPI}/listen/${process.env.CLIENT_USERNAME}`);
    let channelsToListenIn = listenResp.data.map((item) => item.channel);
    if (process.env.DEBUG === 'TRUE') {
        channelsToListenIn = [clientConfig.owner];
        console.log(`STARTING IN DEBUG MODE`);
    }
    console.log(channelsToListenIn);

    const chatClient = new ChatClient(auth, {
        channels: channelsToListenIn,
        botLevel: 'none',
        logger: { minLevel: 'info' },
    });

    await chatClient.connect();

    const autoMsgResp = await axios.get(`${internalAPI}/message/automsg/`);

    for (var i = 0; i < autoMsgResp.data.length; i++) {
        sendAutomatedMessage(autoMsgResp.data[i]);
    }

    async function sendAutomatedMessage(foo) {
        setInterval(async function () {
            if (foo.bot !== process.env.CLIENT_USERNAME) return;
            if (foo.online == true) {
                if ((await apiClient.helix.streams.getStreamByUserName(foo.channel.replace('#', ''))) == null ? false : true) {
                    let updatedResponse = foo.message;
                    let finalStr = updatedResponse;

                    if (updatedResponse.indexOf('$fetchURL(') != -1) {
                        var start_pos = updatedResponse.indexOf('$fetchURL(') + 10;
                        var end_pos = updatedResponse.indexOf(')', start_pos);
                        var text_to_get = updatedResponse.substring(start_pos, end_pos);
                        let customURL = text_to_get;
                        let customResp = await axios
                            .get(customURL, { timeout: 10000 })
                            .then(function (response) {
                                let re = /(\).).+?(?=\s|$)/;
                                if (finalStr.match(re)) {
                                    let objTarget = finalStr.match(re)[0].substring(2);
                                    finalStr = updatedResponse.replace(`$fetchURL(${text_to_get})`, response.data[objTarget]).replace(`.${objTarget}`, '');
                                    chatClient.say(foo.channel, finalStr);
                                } else {
                                    finalStr = updatedResponse.replace(`$fetchURL(${text_to_get})`, response.data);
                                    chatClient.say(foo.channel, finalStr);
                                }
                            })
                            .catch(function (err) {
                                chatClient.say(foo.channel, `Error while fetching "${customURL}": ${err}`);
                            });
                    } else {
                        chatClient.say(foo.channel, foo.message);
                    }
                }
            } else {
                let updatedResponse = foo.message;
                let finalStr = updatedResponse;

                if (updatedResponse.indexOf('$fetchURL(') != -1) {
                    var start_pos = updatedResponse.indexOf('$fetchURL(') + 10;
                    var end_pos = updatedResponse.indexOf(')', start_pos);
                    var text_to_get = updatedResponse.substring(start_pos, end_pos);
                    let customURL = text_to_get;
                    let customResp = await axios
                        .get(customURL, { timeout: 10000 })
                        .then(function (response) {
                            let re = /(\).).+?(?=\s|$)/;
                            if (finalStr.match(re)) {
                                let objTarget = finalStr.match(re)[0].substring(2);
                                finalStr = updatedResponse.replace(`$fetchURL(${text_to_get})`, response.data[objTarget]).replace(`.${objTarget}`, '');
                                chatClient.say(foo.channel, finalStr);
                            } else {
                                finalStr = updatedResponse.replace(`$fetchURL(${text_to_get})`, response.data);
                                chatClient.say(foo.channel, finalStr);
                            }
                        })
                        .catch(function (err) {
                            chatClient.say(foo.channel, `Error while fetching "${customURL}": ${err}`);
                        });
                } else {
                    chatClient.say(foo.channel, foo.message);
                }
            }
        }, foo.timer * 60000);
    }

    chatClient.onJoin((channel, user) => {
        console.log(`${user} joined ${channel}`);
        // chatClient.say(channel, `MrDestructoid Joined channel!`);

        if (channel === '#auror6s') chatClient.say('auror6s', `PagMan BOT STARTED ${process.env.DEBUG === 'TRUE' ? 'IN DEBUG MODE' : ''}`);
    });

    chatClient.onMessage(async (channel, user, message, msg) => {
        if (user === process.env.CLIENT_USERNAME) return;
        var Rargs: string[] = message.split(' ');

        let channelAllData = (await axios.get(`${internalAPI}/message/all/${channel.replace('#', '')}`)).data;

        let _obj = channelAllData.terms;
        if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
            //
        } else {
            for (var i = 0; i < _obj.length; i++) {
                if (_obj[i].sub == true) {
                    if (msg.userInfo.isSubscriber) {
                        //
                    } else {
                        let re = new RegExp(_obj[i].regex, 'gi');
                        if (message.match(re)) {
                            let finalStr = _obj[i].response.replace('${user}', user).replace('${ag}', `Matched group: ${_obj[i].title}`);
                            if (finalStr.includes('$(newline)')) {
                                let splitStr = finalStr.split('$(newline)');
                                for (var i = 0; i < splitStr.length; i++) {
                                    chatClient.say(channel, splitStr[i].replace('${user}', user));
                                }
                            } else {
                                chatClient.say(channel, finalStr);
                            }
                        }
                    }
                } else {
                    let re = new RegExp(_obj[i].regex, 'gi');
                    if (message.match(re)) {
                        let finalStr = _obj[i].response.replace('${user}', user).replace('${ag}', `Matched group: ${_obj[i].title}`);
                        if (finalStr.includes('$(newline)')) {
                            let splitStr = finalStr.split('$(newline)');
                            for (var i = 0; i < splitStr.length; i++) {
                                chatClient.say(channel, splitStr[i].replace('${user}', user));
                            }
                        } else {
                            chatClient.say(channel, finalStr);
                        }
                    }
                }
            }
        }

        let obj = channelAllData.commands;
        for (var i = 0; i < obj.length; i++) {
            if (Rargs[0] === obj[i].command) {
                if (!customOnCooldown.has(`${obj[i].command}${channel}`)) {
                    // make this better \/
                    let updatedResponse = obj[i].response
                        .replace('$<sender>', user.replace('#', ''))
                        .replace('$<channel>', channel.replace('#', ''))
                        .replace('$<args1>', Rargs[1])
                        .replace('$<args2>', Rargs[2])
                        .replace('$<sArgs1>', Rargs[1] == undefined ? user : Rargs[1]);

                    let finalStr = updatedResponse;

                    if (updatedResponse.indexOf('$fetchURL(') != -1) {
                        var start_pos = updatedResponse.indexOf('$fetchURL(') + 10;
                        var end_pos = updatedResponse.indexOf(')', start_pos);
                        var text_to_get = updatedResponse.substring(start_pos, end_pos);
                        let customURL = text_to_get;
                        let customResp = await axios
                            .get(customURL, { timeout: 10000 })
                            .then(function (response) {
                                let re = /(\).).+?(?=\s|$)/;
                                if (finalStr.match(re)) {
                                    let objTarget = finalStr.match(re)[0].substring(2);
                                    finalStr = updatedResponse.replace(`$fetchURL(${text_to_get})`, response.data[objTarget]).replace(`.${objTarget}`, '');
                                    if (finalStr.includes('$(newline)')) {
                                        let splitStr = finalStr.split('$(newline)');
                                        for (var e = 0; e < splitStr.length; e++) {
                                            chatClient.say(channel, splitStr[e]);
                                        }
                                    } else {
                                        chatClient.say(channel, finalStr);
                                    }
                                } else {
                                    finalStr = updatedResponse.replace(`$fetchURL(${text_to_get})`, response.data);
                                    if (finalStr.includes('$(newline)')) {
                                        let splitStr = finalStr.split('$(newline)');
                                        for (var e = 0; e < splitStr.length; e++) {
                                            chatClient.say(channel, splitStr[e]);
                                        }
                                    } else {
                                        chatClient.say(channel, finalStr);
                                    }
                                }
                            })
                            .catch(function (err) {
                                chatClient.say(channel, `Error: ${err}`);
                            });
                    } else {
                        if (finalStr.includes('$(newline)')) {
                            let splitStr = finalStr.split('$(newline)');
                            console.log(splitStr);
                            for (var e = 0; e < splitStr.length; e++) {
                                chatClient.say(channel, splitStr[e]);
                            }
                        } else {
                            chatClient.say(channel, finalStr);
                        }
                    }

                    if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
                        // this is nasty, but using !'s before ismod or broadcaster doesnt work
                    } else {
                        customOnCooldown.add(`${obj[i].command}${channel}`);
                        setTimeout(clearCooldown.bind(null, obj[i].command), obj[i].cooldown * 1000);
                    }
                }
            }
        }
        function clearCooldown(foo) {
            customOnCooldown.delete(`${foo}${channel}`);
        }

        if (!message.startsWith(process.env.PREFIX)) return;
        var args: string[] = message.substr(process.env.PREFIX.length).split(' ');

        switch (args[0]) {
            case 'ping':
                chatClient.say(
                    channel,
                    `Pong! Serving ${channelsToListenIn.length} channels for ${auroMs.relativeTime(
                        Math.round(process.uptime() * 1000),
                        false
                    )}. View Custom API Status at https://stats.uptimerobot.com/2JRDMCkY43`
                );
                break;

            case 'downloadclip':
            case 'getclip':
                if (!_onCooldown.has(`getclip${user}`)) {
                    if (!args[1]) return chatClient.say(channel, 'Please provide a clip link or slug');

                    let clipRes:
                        | {
                              realClip: boolean;
                              qualities: any[];
                              clipKey: any;
                              duration: any;
                              broadcaster: { id: any; displayName: any };
                              curator: { id: any; displayName: any };
                              title: any;
                              viewCount: any;
                              error: string;
                          }
                        | {
                              realClip: boolean;
                              qualities: any;
                              clipKey: any;
                              duration: any;
                              broadcaster: { id: any; displayName: any };
                              curator: { id: any; displayName: any };
                              title: any;
                              viewCount: any;
                              error: any;
                          };

                    try {
                        clipRes = await sourceURL(args[1]);
                        console.log(clipRes);
                    } catch (err) {
                        chatClient.say(channel, err);
                    }

                    if (user.replace('#', '') === clientConfig.owner) {
                        // this is nasty, but using !'s before ismod or broadcaster doesnt work
                    } else {
                        _onCooldown.add(`getclip${user}`);
                        setTimeout(function () {
                            _onCooldown.delete(`getclip${user}$`);
                        }, 5 * 1000);
                    }

                    if (!clipRes.realClip) return chatClient.say(channel, 'The provided argument is not a valid clip');

                    if (args[2]) {
                        let bestClip = clipRes.qualities.filter((quality) => quality.quality === args[2].replace('p', ''))?.[0];

                        let allQualities = clipRes.qualities.map((quality) => `${quality.quality}p`);
                        allQualities.pop();
                        if (!bestClip)
                            // prettier-ignore
                            return chatClient.say(channel, `Resolution not found. Available resolutions: ${[allQualities.slice(0, -1).join(', '), allQualities.slice(-1)[0]].join(allQualities.length < 2 ? '' : ', and ')}`
                        );
                        chatClient.say(channel, `${bestClip.quality}p${bestClip.frameRate} ${bestClip.sourceURL}${clipRes.clipKey}`);
                    } else {
                        let bestClip = clipRes.qualities[clipRes.qualities.length - 1];
                        chatClient.say(channel, `Highest Resolution: ${bestClip.quality}p${bestClip.frameRate} ${bestClip.sourceURL}${clipRes.clipKey}`);
                    }
                }
                break;

            case 'commands':
                if (!_onCooldown.has(`commands${channel}`)) {
                    _onCooldown.add(`commands${channel}`);
                    console.log(_onCooldown);
                    setTimeout(function () {
                        _onCooldown.delete(`commands${channel}`);
                    }, 30000);
                    axios
                        .get(`${internalAPI}/message/command/${channel.replace('#', '')}`)
                        .then((data) => {
                            let apiPostCode = `${channel.replace('#', '')} | ${process.env.CLIENT_USERNAME} | ${moment().format('HH:MM MM/DD/YY')}\n\n\nCustom Commands:\n\n`;

                            for (var i = 0; i < data.data.length; i++) {
                                apiPostCode = apiPostCode + `Command: ${data.data[i].command}\nResponse: ${data.data[i].response}\nCooldown: ${data.data[i].cooldown} seconds\n\n`;
                            }

                            apiPostCode = apiPostCode + `Global Commands:\n\n`;

                            for (var i = 0; i < clientCommands.length; i++) {
                                apiPostCode =
                                    apiPostCode +
                                    `Command: ${clientCommands[i].command}\nDescription: ${clientCommands[i].description}\nUsage: ${clientCommands[i].usage}\nPermission: ${clientCommands[i].permission}\nCooldown: ${clientCommands[i].cooldown} seconds\n\n`;
                            }

                            apiPostCode = apiPostCode + `Bot made by @AuroR6S`;
                            axios
                                .post(`${process.env.HASTEBIN_SERVER}/documents`, apiPostCode)
                                .then((data) => {
                                    chatClient.say(channel, `You can find a list of all commands here: ${process.env.HASTEBIN_SERVER}/${data.data.key}`);
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
                        })
                        .catch((err) => {
                            chatClient.say(channel, `Error: ${err}`);
                        });
                }
                break;

            case 'follownuke':
                if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
                    if (!args[1]) return chatClient.say(channel, 'Please provide a time! (30s, 5m, 1h)');
                    let dontBan = false;
                    if (args[2] === '--dont-ban') dontBan = true;
                    let timeToCallback = Math.abs(ms(args[1]));
                    try {
                        // get the channel id
                        let channelID = (await apiClient.helix.users.getUserByName(channel.replace('#', ''))).id;

                        // get the time to callback for
                        let timeToCallback = Math.abs(ms(args[1]));

                        // ignore the max days to callback if the user is the bot owner
                        if (user !== clientConfig.owner) {
                            //                   \/ 1 hr  \/ 24hrs                \/ (3) days
                            if (timeToCallback > 3600000 * 24 * MAX_DAYS_TO_CALLBACK) return chatClient.say(channel, `I can only recall back to ${MAX_DAYS_TO_CALLBACK} days`);
                        }

                        let callbackTime = Date.now() - timeToCallback;

                        // initizlize an empty array to contain all the users to ban
                        let users = [];

                        // use twitchjs's async iteration
                        let followsResp = apiClient.helix.users.getFollowsPaginated({ followedUser: channelID });
                        for await (const user of followsResp) {
                            let followTime = new Date(user.followDate).getTime();
                            if (callbackTime > followTime) {
                                break;
                            } else {
                                users.push(user.userName);
                            }
                        }

                        // hastebin server
                        try {
                            let unbanList = await axios.post(`${process.env.HASTEBIN_SERVER}/documents`, users.map((u) => `/unban ${u}`).join('\n'));
                            let banList = await axios.post(`${process.env.HASTEBIN_SERVER}/documents`, users.map((u) => `/ban ${u}`).join('\n'));

                            // prettier-ignore
                            chatClient.say(channel, `${dontBan ? "Not banning" : "Banning"} ${users.length} users | Unban: ${process.env.HASTEBIN_SERVER}/${unbanList.data.key} | Ban: ${process.env.HASTEBIN_SERVER}/${banList.data.key}`);
                        } catch (err) {
                            chatClient.say(channel, `There was an error with the Hastebin server: ${err}`);
                        }

                        // finally, loop through users array and ban each user
                        if (dontBan) return;
                        for (const user of users) {
                            chatClient.say(channel, `/ban ${user}`);
                        }
                    } catch (err) {
                        chatClient.say(channel, `There was an error: ${err}`);
                        console.error(err);
                    }
                }
                break;

            case 'filesayfast':
                if (user != clientConfig.owner) return;
                const pastebinResp = await axios.get(args[1]);
                var splitResp = pastebinResp.data.split('\n');
                for (var i = 0; i < splitResp.length; i++) {
                    chatClient.say(channel, splitResp[i]);
                }
                break;

            /*
            // !remindme in 5m microwave
            // !remindme in <time> <title>
            case 'remindme':
                if (args[1] === 'in') {
                    // this is disgusting
                    let time = args[2];
                    let timeout = Math.abs(ms(time));
                    if (timeout > 21600000 * 2) {
                        return chatClient.say(channel, 'I can only remind you in up to 12 hours!');
                    }
                    chatClient.say(channel, `@${user}, Reminder set for ${ms(timeout, { long: true })} from now`);
                    setTimeout(function () {
                        args.splice(0, 3);
                        let comment = args.length == 0 ? '<no comment>' : args.join(' ');
                        chatClient.say(channel, `@${user}, "${comment}" from ${ms(timeout, { long: true })} ago`);
                    }, timeout);
                } else {
                    chatClient.say(channel, 'Please use this format: !remindme in <time> <comment>');
                }

                break;
            */

            case 'eval':
                if (user != clientConfig.owner) return;
                args.shift();
                const code = args.join(' ');
                let evaled = eval(code);

                if (typeof evaled !== 'string') evaled = inspect(evaled);

                chatClient.say(channel, clean(evaled));

                function clean(text) {
                    if (typeof text === 'string') return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
                    else return text;
                }
                break;

            case 'pull':
                if (user != clientConfig.owner) return;

                exec('git pull origin', async (error, stdout, stderr) => {
                    if (error) chatClient.say(channel, `Error: "${error.message}`);
                    if (stderr) chatClient.say(channel, `VisLaud 👉 ${stderr}`);

                    if (stderr) {
                        if (stderr.includes('Already up to date')) {
                            chatClient.say(channel, stderr);
                        } else {
                            let finalStr = stderr.replace('https://github.com/', '');
                            await chatClient.say(channel, finalStr);
                            await chatClient.say(channel, 'Okayge 👋 process.exit();');
                            process.exit();
                        }
                    } else if (stdout) {
                        if (stdout.includes('Already up to date')) {
                            chatClient.say(channel, stdout);
                        } else {
                            let finalStr = stdout.replace('https://github.com/', '');
                            await chatClient.say(channel, finalStr);
                            await chatClient.say(channel, 'Okayge 👋 process.exit();');
                            process.exit();
                        }
                    } else {
                        chatClient.say(channel, 'Unknown Error');
                    }
                });

                break;

            case 'followage':
            case 'fa':
                if (!_onCooldown.has(`fa${channel}${user}`)) {
                    try {
                        let targetUser = args[1] || user;
                        let targetChannel = args[2] || user;

                        let targetId = (await apiClient.helix.users.getUserByName(targetUser)).id;

                        let followsResp = apiClient.helix.users.getFollowsPaginated({ user: targetId });

                        let followData: { userDisplayName: string; followedUserName: string; time: any };
                        for await (const user of followsResp) {
                            if (user.followedUserName === targetChannel) {
                                followData = {
                                    userDisplayName: user.userDisplayName,
                                    followedUserName: user.followedUserName,
                                    time: auroMs.relativeTime(Date.now() - new Date(user.followDate).getTime(), true),
                                };
                            }
                        }

                        _onCooldown.add(`fa${channel}${user}`);
                        console.log(_onCooldown);
                        setTimeout(function () {
                            _onCooldown.delete(`fa${channel}${user}`);
                        }, 5000);

                        if (!followData) {
                            chatClient.say(channel, `${targetUser} is not following ${targetChannel}`);
                        } else {
                            chatClient.say(channel, `${followData.userDisplayName} has been following ${followData.followedUserName} for ${followData.time}`);
                        }
                    } catch (err) {
                        chatClient.say(channel, `Error: ${err}`);
                    }
                }

                break;

            case 'subbage':
            case 'sa':
                if (!_onCooldown.has(`sa${channel}`)) {
                    let targetUser = args[1] || user;
                    let targetChannel = args[2] || channel.replace('#', '');

                    axios
                        .get(`https://api.ivr.fi/twitch/subage/${targetUser}/${targetChannel}`)
                        .then((resp) => {
                            if (resp.data.subscribed) {
                                let tier = resp.data.meta.tier;
                                let dnr = resp.data.meta.dnr;
                                let endsAt = auroMs.relativeTime(moment(resp.data.meta?.endsAt).unix() * 1000 - Date.now());
                                let renewsAt = auroMs.relativeTime(moment(resp.data.meta?.renewsAt).unix() * 1000 - Date.now());
                                let gift = resp.data.meta?.gift;

                                let saReturn: string;

                                let streak = resp.data.streak?.months ? ` with a streak of ${resp.data.streak.months} months` : '';

                                if (resp.data.hidden) {
                                    if (resp.data.meta.type === 'paid') {
                                        if (dnr) {
                                            // prettier-ignore
                                            saReturn = `${resp.data.username} has their subscription to ${resp.data.channel} hidden with a Tier ${tier} sub ${streak} and ends in ${endsAt}`;
                                        } else {
                                            // prettier-ignore
                                            saReturn = `${resp.data.username} has their subscription to ${resp.data.channel} hidden with a Tier with a Tier ${tier} sub ${streak} and renews in ${renewsAt}`;
                                        }
                                    } else if (resp.data.meta.type === 'gift') {
                                        // prettier-ignore
                                        saReturn = `${resp.data.username} has their subscription to ${resp.data.channel} hidden with a gifted subscription by ${gift.name} and ends in ${endsAt}`;
                                    } else if (resp.data.meta.type === 'prime') {
                                        // prettier-ignore
                                        saReturn = `${resp.data.username} has their subscription to ${resp.data.channel} hidden with a Prime subscription and ends in ${endsAt}`;
                                    }
                                } else {
                                    if (resp.data.meta.type === 'paid') {
                                        if (dnr) {
                                            // prettier-ignore
                                            saReturn = `${resp.data.username} has been subscribed to ${resp.data.channel} for ${resp.data.cumulative.months} month(s) with a Tier ${tier} sub ${streak} and ends in ${endsAt}`;
                                        } else {
                                            // prettier-ignore
                                            saReturn = `${resp.data.username} has been subscribed to ${resp.data.channel} for ${resp.data.cumulative.months} month(s) with a Tier ${tier} sub ${streak} and renews in ${renewsAt}`;
                                        }
                                    } else if (resp.data.meta.type === 'gift') {
                                        // prettier-ignore
                                        saReturn = `${resp.data.username} has been subscribed to ${resp.data.channel} with a gifted subscription by ${gift.name} for ${resp.data.cumulative.months} month(s) with a Tier ${tier} sub ${streak} and ends in ${endsAt}`;
                                    } else if (resp.data.meta.type === 'prime') {
                                        // prettier-ignore
                                        saReturn = `${resp.data.username} has been subscribed to ${resp.data.channel} with a Prime subscription for ${resp.data.cumulative.months} month(s) ${streak} and ends in ${endsAt}`;
                                    }
                                }

                                chatClient.say(channel, `@${msg.userInfo.userName}, ${saReturn}`);
                            } else {
                                let endedAt = auroMs.relativeTime(Date.now() - moment(resp.data.cumulative?.end).unix() * 1000);

                                if (resp.data.cumulative.months > 0) {
                                    // prettier-ignore
                                    chatClient.say(channel, `@${msg.userInfo.userName}, ${resp.data.username} has previously been subscribed to ${resp.data.channel} for ${resp.data.cumulative.months} months, however it ended ${endedAt} ago`);
                                } else {
                                    chatClient.say(channel, `@${msg.userInfo.userName}, ${resp.data.username} has never been subscribed to ${resp.data.channel}`);
                                }
                            }

                            _onCooldown.add(`sa${channel}`);
                            console.log(_onCooldown);
                            setTimeout(function () {
                                _onCooldown.delete(`sa${channel}`);
                            }, 5000);
                        })
                        .catch((err) => {
                            if (err.response?.status == 404) {
                                chatClient.say(channel, `Error: ${err.response.data.error}`);
                            } else {
                                chatClient.say(channel, err);
                            }
                        });
                } else {
                    chatClient.say(channel, `@${msg.userInfo.userName}, please wait before using this command again!`);
                }
                break;

            case 'commit':
            case 'version':
                exec('git rev-parse HEAD', (error, stdout, stderr) => {
                    if (error) chatClient.say(channel, `Error: "${error.message}`);
                    if (stderr) chatClient.say(channel, `StdError: ${stderr}`);

                    chatClient.say(channel, `CoolCat Commit: ${stdout.slice(0, 7)}`);
                });
                break;

            case 'reconnect':
                if (user != clientConfig.owner) return;
                await chatClient.reconnect();
                break;

            case 'listen':
                if (user != clientConfig.owner) return;
                if (!args[1]) return;

                let data = {
                    channel: args[1],
                };

                axios.post(`${internalAPI}/listen/add/${process.env.CLIENT_USERNAME}`, data).then((resp) => {
                    if (resp.status == 200) {
                        chatClient.join(args[1]);
                        chatClient.say(channel, `Joined ${args[1]} and added to database!`);
                        chatClient.say(`#${args[1]}`, `MrDestructoid Joined channel!`);
                    } else {
                        chatClient.say(channel, `Failed with status code ${resp.status}`);
                    }
                });

                break;

            case 'query':
                if (!_onCooldown.has(`query${user}`)) {
                    args.shift();
                    if (args.length === 0) return chatClient.say(channel, 'Please provide a query');
                    let url = `http://api.wolframalpha.com/v1/result?appid=${process.env.WOLFRAM_ALPHA_KEY}&i=${args.join('+')}`;
                    chatClient.say(channel, (await axios.get(url)).data);

                    if (user.replace('#', '') === clientConfig.owner) {
                        // this is nasty, but using !'s before ismod or broadcaster doesnt work
                    } else {
                        _onCooldown.add(`query${user}`);
                        setTimeout(function () {
                            _onCooldown.delete(`query${user}$`);
                        }, 30 * 1000);
                    }
                }
                break;

            case 'c-add':
                if (user != clientConfig.owner) return;
                if (!args[1] || !args[2]) return;

                let _command = args[1];

                // ⠿⠋⠈⠄⣈⣉⣛⣿
                // ⠁⠄⠄⠛⡻⣿⣻⣿
                // ⣇⠄⠄⠸⡇⢸⠿⣿
                // ⣿⣿⣷⣄⠉⠄⣻⣿

                args.shift();
                args.shift();

                let cmdData = {
                    command: _command,
                    response: args.join(' '),
                    channel: channel.replace('#', ''),
                    cooldown: 5,
                };

                axios.post(`${internalAPI}/message/command/`, cmdData).then((data) => {
                    chatClient.say(channel, `Added command: "${data.data.command}" with the response of: ${data.data.response}`);
                });

                break;

            case 'bae-test':
                if (user !== 'auror6s') return;

                let preferredEmotes = args[1].split(',');
                let fallbackEmote = args[2];

                let _channel = args[3] || channel.replace('#', '');

                let preferredEmote = await getBestEmote(_channel, preferredEmotes, fallbackEmote);

                if (preferredEmote.error != null) {
                    chatClient.say(channel, preferredEmote.error);
                } else {
                    chatClient.say(channel, preferredEmote.bestAvailableEmote);
                }

                break;

            case 'bing':
                if (!_onCooldown.has(`bing${user}${channel}`)) {
                    let chatters = (await apiClient.unsupported.getChatters(channel.replace('#', ''))).allChatters;
                    let preferredEmote = await getBestEmote(channel.replace('#', ''), ['Bing', 'DinkDonk', 'dinkDonk', 'pajaDink', ':tf:'], '🤭👉🔔');
                    chatClient.say(channel, `${preferredEmote.bestAvailableEmote} @${chatters[Math.floor(Math.random() * chatters.length)]}`);

                    if (msg.userInfo.isBroadcaster) {
                        // this is nasty, but using !'s before ismod or broadcaster doesnt work
                    } else {
                        _onCooldown.add(`bing${user}${channel}`);
                        setTimeout(function () {
                            _onCooldown.delete(`bing${user}${channel}`);
                        }, 30 * 1000);
                    }
                }
                break;

            case 'rl':
                if (!_onCooldown.has(`rl${user}${channel}`)) {
                    let targetUser = args[1] || user;
                    let targetChannel = args[2] || channel.replace('#', '');

                    axios
                        .get(`https://api.ivr.fi/logs/rq/${targetChannel}/${targetUser}`)
                        .then((resp) => {
                            chatClient.say(channel, `"${resp.data.message.replace(/(auro)/gi, 'A_uro')}", by ${resp.data.user} from ${resp.data.time}`);
                        })
                        .catch((err) => {
                            chatClient.say(channel, err);
                        });

                    if (msg.userInfo.isBroadcaster) {
                        //
                    } else {
                        _onCooldown.add(`rl${user}${channel}`);
                        setTimeout(function () {
                            _onCooldown.delete(`rl${user}${channel}`);
                        }, 5 * 1000);
                    }
                }

                break;

            case 'clipurl':
                chatClient.say(channel, `${highestQualityClip}`);
                break;

            case 'clip':
                if (!_onCooldown.has(`clip${channel}`)) {
                    try {
                        let clipsResp = await axios.get(`${internalAPI}/clip/`);
                        if (clipsResp.status != 200) return chatClient.say(channel, 'There was an error reaching the internal API');

                        let discordData;

                        for (var i = 0; i < clipsResp.data.length; i++) {
                            if (clipsResp.data[i].channel === channel.replace('#', '')) {
                                discordData = clipsResp.data[i];
                            }
                        }

                        if (!discordData) {
                            return chatClient.say(channel, 'This channel does not have the clips command enabled!');
                        }

                        _onCooldown.add(`clip${channel}`);
                        console.log(_onCooldown);
                        setTimeout(function () {
                            _onCooldown.delete(`clip${channel}`);
                        }, 30000);

                        // Channel ID & If stream is online
                        let streamResp = await apiClient.helix.streams.getStreamByUserName(channel.replace('#', ''));

                        // Check if the stream response is null, meaning it isnt live
                        if (streamResp == null) return chatClient.say(channel, `@${msg.userInfo.userName}, this channel is currently offline! FailFish`);

                        // Create the clip
                        chatClient.say(channel, `@${msg.userInfo.userName}, GivePLZ Creating your clip...`);
                        let clippedResp = await apiClient2.helix.clips.createClip({ channelId: streamResp.userId, createAfterDelay: true });

                        // Give the twitch api 5 seconds to create a clip
                        await new Promise((r) => setTimeout(r, TIME_TO_WAIT_CLIP));
                        let getClipResp = await apiClient.helix.clips.getClipById(clippedResp);

                        // Check if the clip was actually created
                        if (getClipResp == null) {
                            chatClient.say(channel, `@${msg.userInfo.userName}, there was an error creating your clip, give me a few more seconds Jebaited`);
                            clippedResp = await apiClient2.helix.clips.createClip({ channelId: streamResp.userId, createAfterDelay: true });
                            await new Promise((r) => setTimeout(r, TIME_TO_WAIT_CLIP * 2));
                            getClipResp = await apiClient.helix.clips.getClipById(clippedResp);
                        }
                        if (getClipResp == null) {
                            chatClient.say(channel, `@${msg.userInfo.userName}, there was an error creating your clip, try running the command again FailFish`);
                            _onCooldown.delete(`clips${channel}`);
                        }

                        let clipRes:
                            | {
                                  realClip: boolean;
                                  qualities: any;
                                  clipKey: any;
                                  duration: any;
                                  broadcaster: { id: any; displayName: any };
                                  curator: { id: any; displayName: any };
                                  title: any;
                                  viewCount: any;
                                  error: any;
                              }
                            | {
                                  realClip: boolean;
                                  qualities: any[];
                                  clipKey: any;
                                  duration: any;
                                  broadcaster: { id: any; displayName: any };
                                  curator: { id: any; displayName: any };
                                  title: any;
                                  viewCount: any;
                                  error: any;
                              };
                        let bestClip: { sourceURL: any };

                        try {
                            clipRes = await sourceURL(clippedResp);
                            if (clipRes.error) {
                                chatClient.say(channel, `Error: ${clipRes.error}`);
                            } else {
                                bestClip = clipRes.qualities[clipRes.qualities.length - 1];
                            }
                        } catch (err) {
                            chatClient.say(channel, `Error: ${err}`);
                        }

                        highestQualityClip = bestClip.sourceURL;

                        // initialize the discord webhook
                        let dcWebhook = new Discord.WebhookClient(discordData.whID, discordData.whToken);

                        args.shift(); // args.join(" ").replace("@", "");
                        let clipTitle: string = args[1] ? `\n${args.join(' ').replace('@', '')}\n\n` : `\n\n`;
                        // prettier-ignore
                        await dcWebhook.send(`**${streamResp.userName}** playing ${streamResp.gameName} clipped by **${msg.userInfo.userName}**!${clipTitle}${bestClip.sourceURL}${clipRes.clipKey}`);

                        chatClient.say(channel, `PogChamp @${msg.userInfo.userName}, sent the clip to the Discord!`);
                    } catch (err) {
                        chatClient.say(channel, `Error: ${err}`);
                        chatClient.say('auror6s', `🚨 @auror6s ERROR IN ${channel}: ${err}`);

                        let finalStr = moment().format('HH:mm:ss.SS M/DD/YY');
                        finalStr = `
                        Clip Error Info | ${channel} | ${finalStr}
                        
                        Error Stack Trace:
                        ${err.stack}
                    
                        Bot by AuroR6S | ${moment().format(`ZZ | x`)}
                        `;

                        let rejectionResp = await axios.post(`${process.env.HASTEBIN_SERVER}/documents`, finalStr);

                        console.log(`${process.env.HASTEBIN_SERVER}/${rejectionResp.data.key}`);

                        let dcWebhook = new Discord.WebhookClient(process.env.WHID, process.env.WHTOKEN);
                        await dcWebhook.send(`@everyone ${process.env.HASTEBIN_SERVER}/${rejectionResp.data.key}`);
                    }
                } else {
                    chatClient.say(channel, `@${msg.userInfo.userName}, please wait before using this command again!`);
                }
                break;
        }
    });

    chatClient.onStandardPayForward(async (channel, user, forwardInfo, msg) => {
        let subResp = (await axios.get(`${internalAPI}/eventsub/subscribe/${channel.replace('#', '')}`)).data[0];
        if (subResp == undefined) return;

        if (forwardInfo?.originalGifterDisplayName) {
            chatClient.say(channel, subResp['onStandardPayForward_gifted'].replace('${displayName}', forwardInfo.displayName).replace('${gifterName}', forwardInfo.originalGifterDisplayName));
        } else {
            chatClient.say(channel, subResp['onStandardPayForward_anon'].replace('${displayName}', forwardInfo.displayName));
        }
    });

    chatClient.onSub(async (channel, user, subInfo, msg) => {
        let subResp = (await axios.get(`${internalAPI}/eventsub/subscribe/${channel.replace('#', '')}`)).data[0];
        if (subResp == undefined) return;
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
        let subResp = (await axios.get(`${internalAPI}/eventsub/subscribe/${channel.replace('#', '')}`)).data[0];
        if (subResp == undefined) return;

        if (subInfo.isPrime) {
            if (subInfo?.streak) {
                // prettier-ignore
                chatClient.say(channel, subResp['onResub_primeStreak'].replace('${displayName}', subInfo.displayName).replace('${months}', subInfo.months).replace('${streak}', subInfo.streak).replace('${planName}', subInfo.planName))
            } else {
                // prettier-ignore
                chatClient.say(channel, subResp['onResub_prime'].replace('${displayName}', subInfo.displayName).replace('${months}', subInfo.months).replace('${planName}', subInfo.planName))
            }
        } else {
            if (subInfo.plan === '1000') {
                if (subInfo?.streak) {
                    // prettier-ignore
                    chatClient.say(channel, subResp['onResub_oneStreak'].replace('${displayName}', subInfo.displayName).replace('${months}', subInfo.months).replace('${streak}', subInfo.streak).replace('${planName}', subInfo.planName))
                } else {
                    // prettier-ignore
                    chatClient.say(channel, subResp['onResub_one'].replace('${displayName}', subInfo.displayName).replace('${months}', subInfo.months).replace('${planName}', subInfo.planName))
                }
            } else if (subInfo.plan === '2000') {
                if (subInfo?.streak) {
                    // prettier-ignore
                    chatClient.say(channel, subResp['onResub_twoStreak'].replace('${displayName}', subInfo.displayName).replace('${months}', subInfo.months).replace('${streak}', subInfo.streak).replace('${planName}', subInfo.planName))
                } else {
                    // prettier-ignore
                    chatClient.say(channel, subResp['onResub_two'].replace('${displayName}', subInfo.displayName).replace('${months}', subInfo.months).replace('${planName}', subInfo.planName))
                }
            } else if (subInfo.plan === '3000') {
                if (subInfo?.streak) {
                    // prettier-ignore
                    chatClient.say(channel, subResp['onResub_threeStreak'].replace('${displayName}', subInfo.displayName).replace('${months}', subInfo.months).replace('${streak}', subInfo.streak).replace('${planName}', subInfo.planName))
                } else {
                    // prettier-ignore
                    chatClient.say(channel, subResp['onResub_three'].replace('${displayName}', subInfo.displayName).replace('${months}', subInfo.months).replace('${planName}', subInfo.planName))
                }
            }
        }
    });

    chatClient.onSubExtend(async (channel, user, subInfo, msg) => {
        let subResp = (await axios.get(`${internalAPI}/eventsub/subscribe/${channel.replace('#', '')}`)).data[0];
        if (subResp == undefined) return;

        chatClient.say(channel, subResp['onSubExtend'].replace('${displayName}', subInfo.displayName).replace('${months}', subInfo.months));
    });

    chatClient.onSubGift(async (channel, user, subInfo, msg) => {
        let subResp = (await axios.get(`${internalAPI}/eventsub/subscribe/${channel.replace('#', '')}`)).data[0];
        if (subResp == undefined) return;

        if (subInfo?.gifterDisplayName) {
            if (subInfo?.streak) {
                chatClient.say(
                    channel,
                    subResp['onSubGift_gifted']
                        .replace('${displayName}', subInfo.displayName)
                        .replace('${planName}', subInfo.planName)
                        .replace('${gifterName}', subInfo.gifterDisplayName)
                        .replace('${months}', subInfo.months)
                );
            } else {
                chatClient.say(
                    channel,
                    subResp['onSubGift_gifted']
                        .replace('${displayName}', subInfo.displayName)
                        .replace('${planName}', subInfo.planName)
                        .replace('${gifterName}', subInfo.gifterDisplayName)
                        .replace('${months}', subInfo.months)
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
                        .replace('${months}', subInfo.months)
                );
            } else {
                // prettier-ignore
                chatClient.say(
                    channel,
                    subResp['onSubGift_anon']
                        .replace('${displayName}', subInfo.displayName)
                        .replace('${planName}', subInfo.planName)
                        .replace('${months}', subInfo.months)
                );
            }
        }
    });

    chatClient.onGiftPaidUpgrade(async (channel, user, subInfo, msg) => {
        let subResp = (await axios.get(`${internalAPI}/eventsub/subscribe/${channel.replace('#', '')}`)).data[0];
        if (subResp == undefined) return;

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
        let subResp = (await axios.get(`${internalAPI}/eventsub/subscribe/${channel.replace('#', '')}`)).data[0];
        if (subResp == undefined) return;

        chatClient.say(channel, subResp['onPrimePaidUpgrade'].replace('${displayName}', subInfo.displayName));
    });

    axios
        .get(`${internalAPI}/eventsub/follow/`)
        .then(async (response) => {
            if (response?.data?.length > 0) {
                for (var i = 0; i < response.data.length; i++) {
                    const channelData = response.data[i];
                    const followSubscription = await listener.subscribeToChannelFollowEvents(channelData.channelID, (e) => {
                        chatClient.say(channelData.channel, channelData.response.replace('%user%', e.userDisplayName));
                    });
                }
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

main();

if (process.env.DEBUG !== 'TRUE') {
    process.on('unhandledRejection', async (reason: Error, promise) => {
        if (reason.message.includes('ETIMEDOUT')) return;

        let finalStr = moment().format('HH:mm:ss.SS M/DD/YY');
        console.log(finalStr);

        finalStr = `
        Error Info | ${process.env.CLIENT_USERNAME} | ${finalStr}
        
        Message:
        ${reason.message}
    
        Name:
        ${reason.name}
    
        Stack Trace:
        ${reason?.stack}
    
        toString:
        ${reason.toString()}
    
        Bot by AuroR6S | ${moment().format(`ZZ | x`)}
        `;

        let rejectionResp = await axios.post(`${process.env.HASTEBIN_SERVER}/documents`, finalStr);

        console.log(`${process.env.HASTEBIN_SERVER}/${rejectionResp.data.key}`);

        let dcWebhook = new Discord.WebhookClient(process.env.WHID, process.env.WHTOKEN);
        await dcWebhook.send(`@everyone ${process.env.HASTEBIN_SERVER}/${rejectionResp.data.key}`);

        /*
        axios
            .post(`https://supinic.com/api/bot/reminder/`, null, {
                params: {
                    username: 'auror6s',
                    text: `OuraBot Uncaught Rejection Info: ${process.env.HASTEBIN_SERVER}/${rejectionResp.data.key}`,
                    private: true,
                },
                headers: {
                    // prettier-ignore
                    'Authorization': `Basic ${process.env.SUPIAUTH}`,
                },
            })
            .catch((data) => {
                console.log(data);
            });
        */

        // fs.writeFile('logs.txt', `${process.env.HASTEBIN_SERVER}/${rejectionResp.data.key} ${moment().format('HH:mm:ss.SS M/DD/YY')}`);
    });
}
