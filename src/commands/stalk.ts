import dotenv from 'dotenv';
import prettyMilliseconds from 'pretty-ms';
import { commitDate, commitHash, config, redis } from '..';
import { getBestEmote } from '../utils/channelEmotes';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { checkMessage } from '../utils/safeMessage';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'stalk';
    description = 'View the most recent message from a user';
    usage = 'stalk <user>';
    aliases = ['lastseen', 'ls'];
    userCooldown = 5;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: null,
                error: ErrorEnum.MISSING_USER,
            };

        let targetUser = args[0].toLowerCase();
        if (targetUser === user) {
            let bestEmote = await getBestEmote(channel, ['PepeA', 'monkaStare', 'Stare'], '😳');
            return {
                success: true,
                message: `You're right here... ${bestEmote.bestAvailableEmote}`,
                error: null,
            };
        }

        if (targetUser === 'oura_bot')
            return {
                success: true,
                message: "MrDestructoid I'm right here",
                error: null,
            };

        let userData = await redis.get(`ob:stalk:${targetUser}`);
        if (!userData)
            return {
                success: true,
                message: 'User not found in database',
                error: null,
            };

        let userDataParsed: StalkUserData = JSON.parse(userData);
        if (userDataParsed.optedOut)
            return {
                success: true,
                message: 'This user has opted out to be the target of this command',
                error: null,
            };

        let timeSince = prettyMilliseconds(new Date().getTime() - userDataParsed.timestamp, {
            secondsDecimalDigits: 0,
        });

        let message = checkMessage(userDataParsed.message) ? `"${userDataParsed.message}"` : '[Message held back]';

        return {
            success: true,
            message: `That user was last seen ${timeSince} ago in ${obfuscateName(userDataParsed.channel)}. Their last message was: ${message}`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();

export type StalkUserData = {
    user: string;
    message: string;
    channel: string;
    timestamp: number;
    optedOut: boolean;
};
