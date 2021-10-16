import dotenv from 'dotenv';
import ms from 'ms';
import { chatClient, NukeMessage, nukeMessages } from '..';
import { upload } from '../utils/apis/haste';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getClient } from '../utils/spamClients';
dotenv.config();

class suggestCommand extends Command {
    name = 'nuke';
    description = 'Timeout users who have sent a specific message in the last X minutes';
    usage = 'nuke (message that can include spaces | /regex/ - g and i modifiers are added) (lookback time) (timeout time|ban)';
    userCooldown = 5;
    channelCooldown = 5;
    requiresMod = true;
    permission = 7;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing message/regex',
                error: null,
            };

        if (!args[1])
            return {
                success: false,
                message: 'Missing lookback time',
                error: null,
            };

        if (!args[2])
            return {
                success: false,
                message: 'Missing timeout time',
                error: null,
            };

        const targetMessage = args.slice(0, args.length - 2).join(' ');
        const perma: Boolean = args[args.length - 1] === 'ban';

        const lookbackTime = ms(args[args.length - 2]) / 1000;
        const timeoutTime = ms(args[args.length - 1]) / 1000;

        if (isNaN(lookbackTime))
            return {
                success: false,
                message: 'Invalid lookback time',
                error: null,
            };

        if (!perma && isNaN(timeoutTime))
            return {
                success: false,
                message: 'Invalid timeout time',
                error: null,
            };

        if (lookbackTime > ms('30m') / 1000)
            return {
                success: false,
                message: `Lookback time must be less than 30 minutes`,
                error: null,
            };

        const channelNukeMessages: NukeMessage[] = nukeMessages.filter((nukeMessage: NukeMessage) => nukeMessage.channel === channel).filter((nukeMessage: NukeMessage) => !nukeMessage.cantTimeout);

        if (channelNukeMessages.length == 0)
            return {
                success: false,
                message: `No valid  messages have been sent here for at least 30 minutes`,
                error: null,
            };

        let usingRegex: Boolean = false;
        let usersToTimeout: string[] = [];
        if (targetMessage.startsWith('/') && targetMessage.endsWith('/')) {
            // check if a valid regex
            let regex: RegExp;
            try {
                regex = new RegExp(targetMessage.slice(1, targetMessage.length - 1), 'gi');
            } catch (e) {
                return {
                    success: false,
                    message: 'Invalid regex',
                    error: null,
                };
            }

            usingRegex = true;
            channelNukeMessages.forEach((nukeMessage: NukeMessage) => {
                if (nukeMessage.message.match(regex)) {
                    usersToTimeout.push(nukeMessage.user);
                }
            });
        } else {
            channelNukeMessages.forEach((nukeMessage: NukeMessage) => {
                if (nukeMessage.message.includes(targetMessage)) {
                    usersToTimeout.push(nukeMessage.user);
                }
            });
        }

        if (usersToTimeout.length == 0)
            return {
                success: false,
                message: `No users were found with the provided ${usingRegex ? 'regex' : 'message'}`,
                error: null,
            };

        usersToTimeout = [...new Set(usersToTimeout)];
        for (const userToTimeout of usersToTimeout) {
            if (perma) {
                await getClient().ban(channel, userToTimeout, `Nuked with ${usingRegex ? 'regex' : 'message'}: "${targetMessage}"`);
            } else {
                await getClient().timeout(channel, userToTimeout, timeoutTime, `Nuked with ${usingRegex ? 'regex' : 'message'}: "${targetMessage}"`);
            }
        }

        // prettier-ignore
        const finalString = `Nuke from ${channel} at ${new Date()}\nChecked against ${usingRegex ? 'regex' : 'message'}: "${targetMessage}"\n\n${usersToTimeout.length} user(s) nuked for ${perma ? 'PERMABAN' : timeoutTime + 's'}\n\nUsers:\n${usersToTimeout.join('\n')}`;
        const URL = await upload(finalString);
        chatClient.whisper(user, `Nuke report from ${channel}: ${URL}`);

        return {
            success: true,
            message: null,
            error: null,
        };

        // USE FOR DEBUGGING ARGS
        // return {
        //     success: true,
        //     message: `${lookbackTime} ${timeoutTime} ${perma}`,
        //     error: null,
        // };
    };
}

export const cmd = new suggestCommand();
