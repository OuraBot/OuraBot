import dotenv from 'dotenv';
import { chatClient } from '..';
import { Channel } from '../models/channel.model';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
import { error } from '../utils/logger';
dotenv.config();

class testComand extends Command {
    name = 'join';
    description = 'Join a bot to a channel';
    usage = 'join <channel>';
    permission = 32;
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

        try {
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
        } catch (err) {
            error(err, [user, channel, args.join(' '), this.name]);
            return {
                success: false,
                message: null,
                error: ErrorEnum.UNKNOWN_ERROR,
            };
        }
    };
}

export const cmd = new testComand();
