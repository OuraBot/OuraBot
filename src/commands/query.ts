import dotenv from 'dotenv';
import { apiClient, chatClient, redis } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
import { obfuscateName } from '../utils/stringManipulation';
import { resolveUser } from '../utils/apis/ivr';
import axios from 'axios';
dotenv.config();

class suggestCommand extends Command {
    name = 'query';
    description = 'Query Wolfram|Alpha';
    usage = 'query <username?>';
    userCooldown = 30;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        return {
            success: false,
            message: 'Command is globally disabled',
            error: null,
        };
        if (!args[0])
            return {
                success: false,
                message: 'Missing query message',
                error: null,
            };

        let resp;
        try {
            resp = await axios.get(`http://api.wolframalpha.com/v1/result?appid=${process.env.WOLFRAM_ALPHA_KEY}&i=${args.join('+')}`);
        } catch (err) {
            return {
                success: false,
                message: `Error while querying Wolfram|Alpha API`,
                error: null,
            };
        }
        return {
            success: true,
            message: resp.data,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
