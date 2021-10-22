import dotenv from 'dotenv';
import { apiClient, chatClient, config } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'crossban';
    description = 'Crossban users across channels defined in config.';
    usage = 'crossban <user> <reason?>';
    permission = 1;
    hidden = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Please provide a user to crossban.',
                error: null,
            };

        let reason = args.slice(1).join(' ');
        reason ? (reason += ` - Crossban by ${user}`) : (reason = `No reason specified - Crossban by ${user}`);

        let missedChannels = [];
        for (let _channel of config.crossbanchannels) {
            let streamResp = await apiClient.streams.getStreamByUserName(channel.replace('#', ''));
            if (streamResp != null) missedChannels.push(_channel);
            await chatClient.say(channel, `/ban ${args[0]} ${reason}`);
        }

        chatClient.say(
            channel,
            `@${user}, Crossbanned user "${args[0]}" across ${config.crossbanchannels.length - missedChannels.length} channels ${
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
