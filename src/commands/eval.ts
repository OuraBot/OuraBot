import dotenv from 'dotenv';
// @ts-ignore
import { apiClient, chatClient, redis } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class evalCommand extends Command {
    name = 'eval';
    description = 'Evaluate Javascript code';
    usage = 'say <code>';
    hidden = true;
    permission = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing code to evaluate (use __1.apiClient|chatClient|redis to access those)',
                error: null,
            };

        apiClient;
        chatClient;
        redis;
        obfuscateName;

        let code = args.join(' ');
        let result = await eval(code);
        return {
            success: true,
            message: `${result}`,
            error: null,
        };
    };
}

export const cmd = new evalCommand();
