import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import dotenv from 'dotenv';
import { apiClient } from '..';
import { resolveUser } from '../utils/apis/ivr';
import { prettyTime } from '../utils/auroMs';
import { Command, CommandReturnClass } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'streaminfo';
    description = 'Get the information about a live channel';
    usage = 'streaminfo <channel>';
    aliases = ['si'];
    channelCooldown = 3;
    userCooldown = 5;
    execute = async (user: string, channel: string, args: string[], cmdMsg: string, msg: TwitchPrivateMessage): Promise<CommandReturnClass> => {
        let channelId = msg.channelId;
        if (args[0]) {
            try {
                let userData = await resolveUser(args[0]);
                if (userData.success) {
                    channelId = userData.user.id;
                } else {
                    return {
                        success: false,
                        message: `Invalid channel`,
                        error: null,
                    };
                }
            } catch (err) {
                return {
                    success: false,
                    message: `Invalid channel`,
                    error: null,
                };
            }
        }

        // sanitize channel name

        let streamInfo = await apiClient.helix.streams.getStreamByUserId(channelId);
        if (streamInfo) {
            return {
                success: true,
                message: `${args[0] ? args[0] : 'This channel'} is ${streamInfo?.gameName ? `playing ${streamInfo.gameName}` : `streaing under no category`} for ${
                    streamInfo.viewers
                } viewers for ${prettyTime(new Date().getTime() - streamInfo.startDate.getTime(), false)}. https://twitch.tv/${streamInfo.userName} `,
                error: null,
            };
        } else {
            return {
                success: true,
                message: `${args[0] ? 'That' : 'This'} channel is not live`,
                error: null,
            };
        }
    };
}

export const cmd = new testComand();
