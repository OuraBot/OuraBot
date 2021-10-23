import axios from 'axios';
import dotenv from 'dotenv';
import { apiClient, chatClient, config, FILE_URLS_REGEX } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'masscrossban';
    description = 'Crossban multiple users across channels defined in config.';
    usage = 'masscrossban <file link> <reason?>';
    permission = 1;
    hidden = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0].match(FILE_URLS_REGEX))
            return {
                success: false,
                message: 'Missing RAW haste/pastebin link',
                error: null,
            };

        let reason = args.slice(1).join(' ');
        reason ? (reason += ` - Crossban by ${user}`) : (reason = `No reason specified - Crossban by ${user}`);

        let users = (await axios.get(args[0])).data.split('\n');

        chatClient.say(
            channel,
            `@${user}, crossbanning ${users.length} users across ${config.crossbanchannels.length} channels. This will take about ${(users.length * config.crossbanchannels.length) / 10} seconds`
        );

        let missedChannels: string[] = [];
        let checkedChannels = new Set();
        for (let user of users) {
            for (let _channel of config.crossbanchannels) {
                // check if we have already checked if the channel is live
                if (!checkedChannels.has(_channel)) {
                    let streamResp = await apiClient.streams.getStreamByUserName(_channel.replace('#', ''));
                    if (streamResp != null) {
                        // channel IS LIVE
                        missedChannels.push(_channel);
                        checkedChannels.add(_channel);
                    } else {
                        // channel is not live
                        checkedChannels.add(_channel);
                        await chatClient.say(_channel, `/ban ${user} ${reason}`);
                    }
                } else {
                    if (!missedChannels.includes(_channel)) await chatClient.say(_channel, `/ban ${user} ${reason}`);
                }
            }
        }

        chatClient.say(
            channel,
            `@${user}, Crossbanned ${users.length} users across ${config.crossbanchannels.length - missedChannels.length} channels ${
                missedChannels.length > 0 ? `| Channels: ${missedChannels.join(', ')} were live so user(s) were not banned there.` : ''
            }`
        );

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
