import axios from 'axios';
import dotenv from 'dotenv';
import prettyMilliseconds from 'pretty-ms';
import { commitDate, commitHash, config, redis } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { getClient } from '../utils/spamClients';
import { capitalizeFirstLetter } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'fortnite';
    description = 'View the Fortnite Item Shop (spammy!)';
    usage = 'fortnite';
    aliases = ['itemshop'];
    userCooldown = 60;
    channelCooldown = 30;
    disabledByDefault = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!process.env.FNBR_KEY) throw new Error('FNBR_KEY is not set in .env');

        let fnbrData = await axios.get('https://fnbr.co/api/shop', {
            headers: {
                'x-api-key': `${process.env.FNBR_KEY}`,
            },
        });

        if (fnbrData.data.status !== 200) throw new Error('Fortnite API returned an error');

        let allItems = fnbrData.data.data.featured.concat(fnbrData.data.data.daily);

        for (let item of allItems) {
            if (item.priceIcon !== 'vbucks') continue;
            getClient().say(channel, `@${user}, ${item.name} (${capitalizeFirstLetter(item.rarity)} ${item.readableType}) for ${item.price} V-Bucks. ${item.images.icon}`);
        }

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
