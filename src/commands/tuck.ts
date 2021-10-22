import dotenv from 'dotenv';
import { getBestEmote } from '../utils/channelEmotes';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'tuck';
    description = 'Tuck a user to bed :)';
    usage = 'tuck <user> <emote?>';
    userCooldown = 5;
    channelCooldown = 0;
    allowCustomPermissions = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        const userToTuck = args[0] || 'Themself';
        const emote = args[1] || (await getBestEmote(channel, ['peepoHappyDank', 'peepoHappy', 'FeelsOkayMan'], '😀')).bestAvailableEmote;
        return {
            success: true,
            message: `${user} tucks ${userToTuck} to bed ${emote} 👉 🛏`,
            error: null,
            noping: true,
        };
    };
}

export const cmd = new suggestCommand();
