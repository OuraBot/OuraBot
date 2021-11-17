import dotenv from 'dotenv';
import { SuggestionModel } from '../models/suggestion.model';
import { getUserAfk, Status } from '../utils/afkManager';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { capitalizeFirstLetter, obfuscateName } from '../utils/stringManipulation';
import prettyMs from 'pretty-ms';
dotenv.config();

class suggestCommand extends Command {
    name = 'check';
    description = 'Check if a user is AFK';
    usage = 'check <user>';
    userCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing user to check',
                error: null,
            };

        let sanitizedUser = args[0].toLowerCase().trim().replace(/^@/, '').replace(/,$/, '');
        const afk = await getUserAfk(sanitizedUser);
        if (afk) {
            const type = afk.status === Status.AFK ? 'AFK' : `${afk.status.toLowerCase()}`;
            const delta = Math.floor(Date.now() - afk.time);

            return {
                success: true,
                message: `${obfuscateName(sanitizedUser)} is ${type}: ${afk.message} (${prettyMs(delta)} ago)`,
                error: null,
            };
        } else {
            return {
                success: true,
                message: `${obfuscateName(sanitizedUser)} is not AFK`,
                error: null,
            };
        }
    };
}

export const cmd = new suggestCommand();
