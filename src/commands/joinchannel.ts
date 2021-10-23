import dotenv from 'dotenv';
import { chatClient } from '..';
import { Channel } from '../models/channel.model';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
dotenv.config();

class testComand extends Command {
    name = 'joinchannel';
    description = 'Join a bot to a channel';
    usage = 'joinchannel <channel>';
    aliases = ['ob_joinchannel', 'ob-joinchannel'];
    permission = 97;
    hidden = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: null,
                error: ErrorEnum.MISSING_CHANNEL,
            };

        let channelName = args[0].replace('#', '');
        let clientUsername = process.env.CLIENT_USERNAME;

        const newChannel = new Channel({
            channel: channelName,
            bot: clientUsername,
        });

        newChannel.save();

        await chatClient.join(channelName);
        chatClient.say(channelName, `MrDestructoid Joined channel!`);

        return {
            success: true,
            message: 'Joined channel',
            error: null,
        };
    };
}

export const cmd = new testComand();
