import axios from 'axios';
import dotenv from 'dotenv';
import { upload } from '../utils/apis/haste';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { fetchBots, KNOWN_BOT_LIST, setBots } from '../utils/knownBots';

dotenv.config();

class testComand extends Command {
    name = 'add-bots';
    description = 'Adds bots to the known bots list and formats them properly';
    usage = 'add-bots';
    permission = 32;
    hidden = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let botsToAdd: string[] = [];
        if (args[0].includes('https://')) {
            const response = await axios.get(args[0]);
            botsToAdd = response.data.split('\n');
        } else {
            botsToAdd = args;
        }
        await fetchBots();
        botsToAdd = botsToAdd.map((bot) => bot.toLowerCase());
        const prevBots = Array.from(KNOWN_BOT_LIST);
        const newList = botsToAdd.concat(prevBots).sort();
        setBots(new Set(newList));
        const hasteURL = await upload(newList.join('\n'));

        return {
            success: true,
            message: `Added ${newList.length - prevBots.length} bots - ${hasteURL} (Update https://gist.github.com/MrAuro/68ec520b109c7f93d55c6cab4ffc7659 now)`,
            error: null,
        };
    };
}

export const cmd = new testComand();
