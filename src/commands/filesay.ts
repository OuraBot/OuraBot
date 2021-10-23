import axios from 'axios';
import dotenv from 'dotenv';
import { cancelFilesayChannels, chatClient, FILE_URLS_REGEX } from '../index';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getClient } from '../utils/spamClients';
import { sanitizeMessage } from '../utils/stringManipulation';

dotenv.config();

class testComand extends Command {
    name = 'filesay';
    description = 'Say a hastebin file';
    usage = 'filesay <url> <formatting - use {line} to access username> <--fast?> <--silent?> <--slow?>';
    aliases = ['ob-filesay', 'ob_filesay'];
    hidden = true;
    requireFastLimits = true;
    permission = 929;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0].match(FILE_URLS_REGEX))
            return {
                success: false,
                message: 'Missing RAW haste/pastebin/gist link',
                error: null,
            };

        let users = (await axios.get(args[0])).data.split('\n');

        const fast = args.includes('--fast');
        const silent = args.includes('--silent');
        const slow = args.includes('--slow');

        if (fast && slow)
            return {
                success: false,
                message: `FailFish You can't use fast and slow flags simultaneously`,
                error: null,
            };

        if (args.length >= 2) {
            const formattedMessage = args.slice(1).join(' ').replace('--fast', '').replace('--silent', '').replace('--slow', '');
            if (fast && silent) {
                if (users.length > 3000) {
                    for (let user of users) {
                        getClient().say(channel, sanitizeMessage(formattedMessage.replace('{line}', user)));
                        await new Promise((resolve) => setTimeout(resolve, 100));
                        if (cancelFileSay(channel))
                            return {
                                success: true,
                                message: `Stopped filesay on line ${users.indexOf(user) + 1}`,
                                error: null,
                            };
                    }
                } else {
                    for (let user of users) {
                        getClient().say(channel, sanitizeMessage(formattedMessage.replace('{line}', user)));
                    }
                }
            } else if (fast) {
                if (users.length > 3000) {
                    chatClient.say(channel, `@${user}, ${users.length} lines`);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    let t1 = Date.now();
                    for (let user of users) {
                        getClient().say(channel, sanitizeMessage(formattedMessage.replace('{line}', user)));
                        await new Promise((resolve) => setTimeout(resolve, 100));
                        if (cancelFileSay(channel))
                            return {
                                success: true,
                                message: `Stopped filesay on line ${users.indexOf(user) + 1}`,
                                error: null,
                            };
                    }
                    let t2 = Date.now();
                    chatClient.say(channel, `@${user}, ${users.length} lines - Took ${(t2 - t1) / 1000} seconds.`);
                } else {
                    chatClient.say(channel, `@${user}, ${users.length} lines`);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    let t1 = Date.now();
                    for (let user of users) {
                        getClient().say(channel, sanitizeMessage(formattedMessage.replace('{line}', user)));
                    }
                    let t2 = Date.now();
                    chatClient.say(channel, `@${user}, ${users.length} lines - Took ${(t2 - t1) / 1000} seconds.`);
                }
            } else if (silent) {
                for (let user of users) {
                    getClient().say(channel, sanitizeMessage(formattedMessage.replace('{line}', user)));
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    if (cancelFileSay(channel))
                        return {
                            success: true,
                            message: `Stopped filesay on line ${users.indexOf(user) + 1}`,
                            error: null,
                        };
                }
            } else if (silent && slow) {
                for (let user of users) {
                    getClient().say(channel, sanitizeMessage(formattedMessage.replace('{line}', user)));
                    await new Promise((resolve) => setTimeout(resolve, 1100));
                    if (cancelFileSay(channel))
                        return {
                            success: true,
                            message: `Stopped filesay on line ${users.indexOf(user) + 1}`,
                            error: null,
                        };
                }
            } else if (slow) {
                chatClient.say(channel, `@${user}, ${users.length} lines - ETA: ${users.length * 1.1}s`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                let t1 = Date.now();
                for (let user of users) {
                    getClient().say(channel, sanitizeMessage(formattedMessage.replace('{line}', user)));
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    if (cancelFileSay(channel))
                        return {
                            success: true,
                            message: `Stopped filesay on line ${users.indexOf(user) + 1}`,
                            error: null,
                        };
                }
                let t2 = Date.now();
                chatClient.say(channel, `@${user}, ${users.length} lines - Took ${(t2 - t1) / 1000} seconds.`);
            } else {
                chatClient.say(channel, `@${user}, ${users.length} lines - ETA: ${users.length * 0.5}s`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                let t1 = Date.now();
                for (let user of users) {
                    getClient().say(channel, sanitizeMessage(formattedMessage.replace('{line}', user)));
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    if (cancelFileSay(channel))
                        return {
                            success: true,
                            message: `Stopped filesay on line ${users.indexOf(user) + 1}`,
                            error: null,
                        };
                }
                let t2 = Date.now();
                chatClient.say(channel, `@${user}, ${users.length} lines - Took ${(t2 - t1) / 1000} seconds.`);
            }
        } else {
            chatClient.say(channel, `@${user}, ${users.length} lines - ETA: ${users.length * 0.5}s`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            let t1 = Date.now();
            for (let user of users) {
                getClient().say(channel, user);
                await new Promise((resolve) => setTimeout(resolve, 500));
                if (cancelFileSay(channel))
                    return {
                        success: true,
                        message: `Stopped filesay on line ${users.indexOf(user) + 1}`,
                        error: null,
                    };
            }
            let t2 = Date.now();
            chatClient.say(channel, `@${user}, ${users.length} lines - Took ${(t2 - t1) / 1000} seconds.`);
        }

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new testComand();

function cancelFileSay(channel: string) {
    if (cancelFilesayChannels.has(channel)) {
        cancelFilesayChannels.delete(channel);
        return true;
    } else {
        return false;
    }
}
