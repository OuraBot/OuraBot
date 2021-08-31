import dotenv from 'dotenv';
import { chatClient, config } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'crossunban';
    description = 'Crossunban users across channels defined in config.';
    usage = 'crossunban <user>';
    permission = 1;
    hidden = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Please provide a user to crossunban.',
                error: null,
            };

        for (let _channel of config.crossbanchannels) {
            await chatClient.say(_channel, `/unban ${args[0]}`);
        }

        chatClient.say(channel, `@${user}, Crossunbanned user "${args[0]}" across ${config.crossbanchannels.length} channels`);

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
