import dotenv from 'dotenv';
import { Command, CommandReturnClass } from '../utils/commandClass';
import axios from 'axios';
dotenv.config();

class randomtitleCommand extends Command {
    name = 'randomtitle';
    description = 'Get a random title based off markov chains from xQc\'s titles.';
    usage = 'randomtitle';
    permission = 1;
    userCooldown = 5;
    channelCooldown = 2;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
	const title = (await axios.get('https://api.mmatt.net/string')).data;	
        return {
            success: true,
            message: title,
            error: null,
        };
    };
}

export const cmd = new randomtitleCommand();
