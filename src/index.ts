import { RefreshableAuthProvider, StaticAuthProvider, ClientCredentialsAuthProvider } from 'twitch-auth';
import { ChatClient, ChatUser, ClearChat } from 'twitch-chat-client';
import { promises as fs } from 'fs';
import { ApiClient } from 'twitch';
import { EventSubListener } from 'twitch-eventsub';
import { NgrokAdapter } from 'twitch-eventsub-ngrok';

import ms from 'ms';
import axios from 'axios';
import Discord, { BaseManager } from 'discord.js';

import clientConfig from '../config.json';

import * as dotenv from 'dotenv';
dotenv.config();

const internalAPI = process.env.INTERNALAPI || 'http://10.0.0.97:5000';

let commandCacheData = [];
let commandCacheTimer = 0;
const onCooldown = new Set();
const customOnCooldown = new Set();

/*
[
    "auror6s": {
        [{command: "gsdkljfg"}, {command:"hirtitky"}]
    },
    "demonjoefrance": {
        [{command: "sdfgh"}, {command: "sdfhdj"}]
    },
]
*/

async function main() {
    console.log(`${clientConfig.username} is starting...`);
    const clientId = process.env.APP_CLIENTID;
    const clientSecret = process.env.APP_SECRET;
    const tokenData = JSON.parse(await fs.readFile('./tokens.json', 'utf-8'));
    const auth = new RefreshableAuthProvider(new StaticAuthProvider(clientId, tokenData.accessToken), {
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
    await apiClient.helix.eventSub.deleteAllSubscriptions();
    const listener = new EventSubListener(apiClient, new NgrokAdapter(), 'AURO-OURABOT-cde93bd0-2683-4aec-b743-06dd461d9b8e');
    await listener.listen();

    const listenResp = await axios.get(`${internalAPI}/listen/`);
    let channelsToListenIn = listenResp.data.map((item) => item.channel);

    console.log(channelsToListenIn);

    const chatClient = new ChatClient(auth, {
        channels: channelsToListenIn,
        botLevel: 'none',
    });

    await chatClient.connect();

    const autoMsgResp = await axios.get(`${internalAPI}/message/automsg/`);

    for (var i = 0; i < autoMsgResp.data.length; i++) {
        sendAutomatedMessage(autoMsgResp.data[i]);
    }

    async function sendAutomatedMessage(foo) {
        setInterval(async function () {
            if (foo.online == true) {
                if ((await apiClient.helix.streams.getStreamByUserName(foo.channel.replace('#', ''))) == null ? false : true) {
                    chatClient.say(foo.channel, foo.message);
                }
            } else {
                chatClient.say(foo.channel, foo.message);
            }
        }, foo.timer * 60000);
    }

    chatClient.onJoin((channel, user) => {
        console.log(`${user} joined ${channel}`);
    });

    chatClient.onMessage(async (channel, user, message, msg) => {
        if (user === clientConfig.username) return;
        var Rargs: string[] = message.split(' ');

        let ccommandResp = await axios({
            method: 'GET',
            url: `${internalAPI}/message/command/${channel.replace('#', '')}`,
        });

        let obj = ccommandResp.data;
        console.log(obj);
        for (var i = 0; i < obj.length; i++) {
            if (Rargs[0] === obj[i].command) {
                if (!customOnCooldown.has(`${obj[i].command}${user}${channel}`)) {

                    // make this better \/
                    let updatedResponse = obj[i].response.replace('$<sender>', user.replace('#', '')).replace('$<channel>', channel.replace('#', '')).replace('$<args1>', Rargs[1]).replace('$<args2>', Rargs[2]).replace('$<sArgs1>', Rargs[1] == undefined ? user : Rargs[1]);
                    
                    let finalStr = updatedResponse;

                    if(updatedResponse.indexOf('$fetchURL(') != -1) {
                        var start_pos = updatedResponse.indexOf('$fetchURL(') + 10;
                        var end_pos = updatedResponse.indexOf(')',start_pos);
                        var text_to_get = updatedResponse.substring(start_pos,end_pos);
    
                        let customResp = await axios.get(text_to_get, { timeout: 5000 });
                        finalStr = (updatedResponse).replace(`$fetchURL(${text_to_get})`, customResp.data)
                    }

                    chatClient.say(channel, finalStr);

                    customOnCooldown.add(`${obj[i].command}${user}${channel}`);
                    setTimeout(clearCooldown.bind(null, obj[i].command), obj[i].cooldown * 1000);
                }
            }
        }
        function clearCooldown(foo) {
            customOnCooldown.delete(`${foo}${user}${channel}`);
        }

        if (!message.startsWith(process.env.PREFIX)) return;
        var args: string[] = message.split(' ');

        switch (args[0]) {
            case 'ping':
                chatClient.say(channel, 'Pong!');
                let ppogpgogpog = await axios.get(`http://localhost:5001/message/command/auror6s`);
                console.log(ppogpgogpog.data);
                break;

            case 'follownuke':
                if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
                    if (!args[1]) return chatClient.say(channel, 'Please provide a time! (30s, 5m, 1h)');
                    let timeToCallback = Math.abs(ms(args[1]));
                    try {
                        let _channelID = (await apiClient.helix.users.getUserByName(channel.replace('#', ''))).id;

                        // initialize an empty array
                        // this should be cleandd up
                        let followsResponse = [];

                        // get follows from twitch api
                        // find only the latest 100 follows
                        let followsResp = await axios({
                            method: 'GET',
                            url: `https://api.twitch.tv/helix/users/follows?to_id=${_channelID}&first=100`,
                            headers: {
                                Authorization: `Bearer ${tokenData.accessToken}`,
                                'Client-Id': process.env.APP_CLIENTID,
                            },
                            timeout: 5000,
                        });

                        // check if user has more than 100 followrs
                        if (followsResp.data.total > 101) {
                            // cursor for paginating
                            let pagCursor = followsResp.data.pagination.cursor;

                            // paginate at the end of the last request
                            let followsResp2 = await axios({
                                method: 'GET',
                                url: `https://api.twitch.tv/helix/users/follows?to_id=${_channelID}&first=100&after${pagCursor}`,
                                headers: {
                                    Authorization: `Bearer ${tokenData.accessToken}`,
                                    'Client-Id': process.env.APP_CLIENTID,
                                },
                                timeout: 5000,
                            });

                            followsResponse = followsResp.data.data.concat(followsResp2.data.data);
                        } else {
                            followsResponse = followsResp.data.data;
                        }

                        let callbackTime = Date.now() - timeToCallback;

                        let banArray = followsResponse.filter((follow) => {
                            let followTime = new Date(follow.followed_at).getTime();
                            if (callbackTime < followTime) return true;
                        });
                        let finalArr2 = banArray.map((user) => user.from_login);
                        chatClient.say(channel, `Follownuking ${finalArr2.length} users`);
                        for (var i = 0; i < finalArr2.length; i++) {
                            chatClient.say(channel, `/ban ${finalArr2[i]} Follownuke`);
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

                axios.post(`${internalAPI}/listen/add`, data).then((resp) => {
                    if (resp.status == 200) {
                        chatClient.join(args[1]);
                        chatClient.say(channel, `Joined ${args[1]} and added to database!`);
                    } else {
                        chatClient.say(channel, `Failed with status code ${resp.status}`);
                    }
                });

                break;

            case 'c-add':
                if (user != clientConfig.owner) return;
                if (!args[1]) return;

                break;

            case 'clip':
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

                    if (onCooldown.has(channel)) {
                    } else {
                        let channelResp = await axios({
                            method: 'GET',
                            url: `https://api.twitch.tv/helix/streams?user_login=${channel.replace('#', '')}`,
                            headers: {
                                Authorization: `Bearer ${tokenData.accessToken}`,
                                'Client-Id': process.env.APP_CLIENTID,
                            },
                        });

                        if (channelResp.data.data[0]?.type !== 'live') return chatClient.say(channel, `/me @${msg.userInfo.userName}, this channel is currently offline! FailFish`);

                        var clippedResp = await axios({
                            method: 'POST',
                            url: `https://api.twitch.tv/helix/clips?broadcaster_id=${msg.channelId}`,
                            headers: {
                                Authorization: `Bearer ${tokenData.accessToken}`,
                                'Client-Id': process.env.APP_CLIENTID,
                            },
                        });

                        chatClient.say(channel, `/me @${msg.userInfo.userName}, GivePLZ Creating your clip...`);
                        // Give the twitch api 5 seconds to create a clip
                        // Using a hard coded number is bad, but even after awaiting for the clip to be generated, the twitch api doesnt immediately create it
                        await new Promise((r) => setTimeout(r, 5000));
                        var clippedGetResp = await axios({
                            method: 'GET',
                            url: `https://api.twitch.tv/helix/clips?id=${clippedResp.data.data[0].id}`,
                            headers: {
                                Authorization: `Bearer ${tokenData.accessToken}`,
                                'Client-Id': process.env.APP_CLIENTID,
                            },
                        });

                        // Check if the clip was actually created
                        if (clippedGetResp.data.data.length == 0) {
                            chatClient.say(channel, `/me @${msg.userInfo.userName}, there was an error creating your clip, give me a few more seconds Jebaited`);
                            clippedResp = await axios({
                                method: 'POST',
                                url: `https://api.twitch.tv/helix/clips?broadcaster_id=${msg.channelId}`,
                                headers: {
                                    Authorization: `Bearer ${tokenData.accessToken}`,
                                    'Client-Id': process.env.APP_CLIENTID,
                                },
                            });
                            await new Promise((r) => setTimeout(r, 10000));
                            clippedGetResp = await axios({
                                method: 'GET',
                                url: `https://api.twitch.tv/helix/clips?id=${clippedResp.data.data[0].id}`,
                                headers: {
                                    Authorization: `Bearer ${tokenData.accessToken}`,
                                    'Client-Id': process.env.APP_CLIENTID,
                                },
                            });
                        }
                        if (clippedGetResp.data.data.length == 0) {
                            chatClient.say(channel, `/me @${msg.userInfo.userName}, there was an error creating your clip, try running the command again FailFish`);
                        }

                        // initialize the discord webhook
                        var dcWebhook = new Discord.WebhookClient(discordData.whID, discordData.whToken);

                        args.shift(); // args.join(" ").replace("@", "");
                        var clipTitle: string = args[1] ? `\n${args.join(' ').replace('@', '')}\n\n` : `\n\n`;
                        // prettier-ignore
                        await dcWebhook.send(`**${channelResp.data.data[0].user_name}** playing ${channelResp.data.data[0].game_name} clipped by **${msg.userInfo.userName}**!${clipTitle}https://production.assets.clips.twitchcdn.net/${clippedGetResp.data.data[0].thumbnail_url.split('/')[3].split('-')[0]}-${clippedGetResp.data.data[0].thumbnail_url.split('/')[3].split('-')[1]}-${clippedGetResp.data.data[0].thumbnail_url.split('/')[3].split('-')[2]}.mp4`);

                        chatClient.say(channel, `/me @${msg.userInfo.userName}, sent the clip to the Discord! PogChamp`);

                        onCooldown.add(channel);
                        setTimeout(() => {
                            onCooldown.delete(channel);
                        }, 60000);
                    }
                } catch (err) {
                    console.error(err);
                    chatClient.say('auror6s', `🚨 ERROR: ${err}`);
                }
                break;
        }
    });

    /*

    chatClient.onSub((channel, user) => {
        chatClient.say(channel, `Thanks to @${user} for subscribing to the channel!`);
    });
    chatClient.onResub((channel, user, subInfo) => {
        chatClient.say(channel, `Thanks to @${user} for subscribing to the channel for a total of ${subInfo.months} months!`);
    });
    chatClient.onSubGift((channel, user, subInfo) => {
        chatClient.say(channel, `Thanks to ${subInfo.gifter} for gifting a subscription to ${user}!`);
    });

    */

    // EVENT SUB
    /*
    const userId = '94568374';
    const followSubscription = await listener.subscribeToChannelFollowEvents(userId, (e) => {
        chatClient.say(e.broadcasterName, `${e.userDisplayName}, thank you for following! KomodoHype`);
    });
    */

    axios
        .get(`${internalAPI}/eventsub/follow/`)
        .then(async (response) => {
            if (response.data.length > 0) {
                for (var i = 0; i < response.data.length; i++) {
                    const channelData = response.data[i];
                    const followSubscription = await listener.subscribeToChannelFollowEvents(channelData.channelID, (e) => {
                        chatClient.say(channelData.channel, channelData.response.replace('%user%', e.userDisplayName));
                        axios.post(`${internalAPI}/follownuke/${e.broadcasterName.toLowerCase()}/add`, { user: e.userName }).then(async (response) => {
                            console.log(`Added ${e.userName} to the follow/add database`);
                        });
                    });
                }
            }
        })
        .catch((error) => {
            console.log(error);
        });

    axios
        .get(`${internalAPI}/eventsub/subscribe/`)
        .then(async (response) => {
            if (response.data.length > 0) {
                for (var i = 0; i < response.data.length; i++) {
                    const channelData = response.data[i];
                    const subscriptionEvent = await listener.subscribeToChannelSubscriptionEvents(channelData.channelID, (e) => {
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
