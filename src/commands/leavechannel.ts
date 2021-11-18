import dotenv from 'dotenv';
import { chatClient } from '..';
import { Channel, IChannel } from '../models/channel.model';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
dotenv.config();

class testComand extends Command {
    name = 'leavechannel';
    description = 'Leave the bot from your channel';
    usage = 'leavechannel <channel>';
    aliases = ['ob_leavechannel', 'ob-leavechannel'];
    permission = 33;
    hidden = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: null,
                error: ErrorEnum.MISSING_CHANNEL,
            };

        let channelName = args[0].replace('#', '').replace('@', '');

        let channels = await Channel.find();
        let channelInfo = channels.map((c: any) => {
            return {
                channel: c.channel.toLowerCase().replace('#', ''),
                _id: c._id,
            };
        });

        let channelId = channelInfo.find((c: any) => {
            return c.channel.includes(channelName.toLowerCase());
        });

        if (!channelId)
            return {
                success: false,
                message: 'Channel not found in database',
                error: null,
            };

        await Channel.findByIdAndDelete(channelId._id);

        await chatClient.part(channelName);

        return {
            success: true,
            message: 'Left channel',
            error: null,
        };
    };
}

export const cmd = new testComand();
