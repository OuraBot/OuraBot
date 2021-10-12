import axios from 'axios';
import dotenv from 'dotenv';
import { chatClient } from '../index';
import { Command, CommandReturnClass } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'banlist';
    description = 'Ban users from a file (useful against bots) - Max of 1000 lines per use';
    usage = 'banlist <paste/haste/gist url>';
    permission = 7; // Developer, Broadcaster, Moderator
    userCooldown = 30;
    channelCooldown = 30;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing RAW HTTPS haste/pastebin/gist link',
                error: null,
            };
        if (!args[0].match(/^https:\/\/(haste\.zneix\.eu\/raw|mrauro\.dev|hastebin\.com\/raw|pastebin\.com\/raw|(raw|gist).githubusercontent.com)\/.+$/))
            return {
                success: false,
                message: 'Missing RAW HTTPS haste/pastebin/gist link',
                error: null,
            };

        axios
            .get(args[0], {
                timeout: 5000,
                maxBodyLength: 50000,
                maxContentLength: 50000,
            })
            .then(async (response: any) => {
                const banlist = response.data.split('\n');
                if (banlist.length > 1000)
                    return {
                        success: false,
                        message: 'Too many lines in banlist (max 1000)',
                        error: null,
                    };

                axios.post(process.env.DISCORD_WEBHOOK, {
                    username: 'Oura_Bot Banlist',
                    content: `Banlist executing in ${channel} by ${user} - ${banlist.length} lines - <${args[0]}>`,
                });

                await chatClient.say(channel, `@${user}, Banlist ETA: ${banlist.length / 10} seconds (${banlist.length} users)`);

                for (let msg of banlist) {
                    const target = msg
                        .replace(/^(\.|\/)ban\s/, '')
                        .split(' ')[0]
                        .toLowerCase();
                    chatClient.say(channel, `/ban ${target}`);
                }

                chatClient.say(channel, `@${user}, Banlist completed!`);
            })
            .catch(async (error) => {
                axios.post(process.env.DISCORD_WEBHOOK, {
                    username: 'Oura_Bot Banlist',
                    content: `ERROR while executing banlist in ${channel} by ${user} - \`${error}\` - <${args[0]}>`,
                });
                chatClient.say(channel, `@${user}, Error while fetching banlist (is it too big? [50kb max])`);
            });

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new testComand();
