import axios from 'axios';
import dotenv from 'dotenv';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { fetchBots, KNOWN_BOT_LIST } from '../utils/knownBots';

dotenv.config();

class testComand extends Command {
    name = 'reload-bots';
    description = 'Reloads the known bot list';
    usage = 'reload-bots';
    permission = 32;
    hidden = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let previousBots = KNOWN_BOT_LIST;
        await fetchBots();
        let newBots = KNOWN_BOT_LIST;

        console.log(previousBots.size, 1111111, newBots.size);
        return {
            success: true,
            message: `${previousBots.size == newBots.size ? 'No new bots fetched' : 'Bot list has been refreshed'}`,
            error: null,
        };
    };
}

export const cmd = new testComand();
