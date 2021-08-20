import dotenv from 'dotenv';
import { chatClient, WEEB_REGEX } from '..';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
import { error } from '../utils/logger';
import { Term } from '../models/term.model';
dotenv.config();

class testComand extends Command {
    name = 'term';
    description = 'Add or remove moderation terms';
    extendedDescription = 'Regex ignores case. Response can use "{newline}" to send more messages. Use / commands to time users out. Use {user} to get the user.';
    usage = 'term <add|remove> <regex> <response>';
    permission = 4;
    userCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing subcommand (add,remove)',
                error: null,
            };

        if (args[0] === 'add') {
            if (!args[1])
                return {
                    success: false,
                    message: 'Missing term regex',
                    error: null,
                };
            if (!args[2])
                return {
                    success: false,
                    message: 'Missing term response',
                    error: null,
                };

            let termRegex = args[1];

            // remove the first 2 elements of args
            args.splice(0, 2);

            let termResponse = args.join(' ');
            if (termResponse.length > 400)
                return {
                    success: false,
                    message: 'Term response must be less than 400 characters',
                    error: null,
                };

            if (!termResponse)
                return {
                    success: false,
                    message: 'Missing term response',
                    error: null,
                };

            if (termRegex === '!{WEEB}') termRegex = WEEB_REGEX.toString();

            let newTerm = new Term({
                channel: channel.replace('#', ''),
                regex: termRegex,
                response: termResponse,
            });

            await newTerm.save();
            return {
                success: true,
                message: `Term with a regex of "${termRegex.length > 400 ? '(REGEX TOO LONG)' : termRegex}" has been added.`,
                error: null,
                ignorebanphrase: true,
            };
        } else if (args[0] === 'remove') {
            if (!args[1]) {
                return {
                    success: false,
                    message: 'Missing term regex',
                    error: null,
                };
            }

            let termRegex = args[1];
            await Term.findOneAndRemove({ regex: termRegex });
            return {
                success: true,
                message: `Term with a regex of "${termRegex}" removed`,
                error: null,
                ignorebanphrase: true,
            };
        } else {
            return {
                success: false,
                message: 'Invalid subcommand (add,remove)',
                error: null,
            };
        }
    };
}

export const cmd = new testComand();
