import axios from 'axios';
import dotenv from 'dotenv';
import { chatClient, config, FILE_URLS_REGEX } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'masscrossunbanslow';
    description = 'Crossunban multiple users across channels defined in config with a 1.2 second delay between each ban.';
    usage = 'masscrossunban <file link> <reason?>';
    permission = 1;
    hidden = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0].match(FILE_URLS_REGEX))
            return {
                success: false,
                message: 'Missing RAW haste/pastebin link',
                error: null,
            };

        let users = (await axios.get(args[0])).data.split('\n');

        chatClient.say(channel, `@${user}, crossunbanning ${users.length} users across ${config.crossbanchannels.length} channels. This will take about ${Math.round(users.length * 1.2)} seconds`);
        for (let user of users) {
            for (let _channel of config.crossbanchannels) {
                await new Promise((resolve) => setTimeout(resolve, 1200));
                await chatClient.say(_channel, `/unban ${user}`);
            }
        }

        chatClient.say(channel, `@${user}, Crossunbanned ${users.length} users across ${config.crossbanchannels.length} channels`);

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
