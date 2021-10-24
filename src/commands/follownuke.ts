import dotenv from 'dotenv';
import ms from 'ms';
import { apiClient, chatClient, config } from '../index';
import { upload } from '../utils/apis/haste';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getClient } from '../utils/spamClients';

dotenv.config();

class testComand extends Command {
    name = 'follownuke';
    description = 'Ban users who have followed in the last X minutes (good against followbots)';
    usage = 'folownuke <time (30s, 5m, 1h)> <--dont-ban?>';
    extendedDescription = 'Use the "--dont-ban" to send a file of all the users';
    permission = 7;
    requiresMod = true;
    userCooldown = 5;
    channelCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Please specify a time (30s, 5m, 1h)',
                error: null,
            };

        let dontBan = false;
        let targetChannel = channel;
        if (args[1] === '--dont-ban') dontBan = true;
        if (args[2] && config.admins.includes(user)) targetChannel = args[2];

        let timeToCallback = Math.abs(ms(args[0]));
        if (timeToCallback > 60000 * 60 * 24 * 3)
            return {
                success: false,
                message: 'I can only recall back to 3 days',
                error: null,
            };

        let channelID = (await apiClient.users.getUserByName(targetChannel.replace('#', ''))).id;
        let callbackTime = Date.now() - timeToCallback;

        let users: string[] = [];

        let followsResp = apiClient.users.getFollowsPaginated({ followedUser: channelID });
        for await (const _user of followsResp) {
            let followTime = new Date(_user.followDate).getTime();
            if (callbackTime > followTime) {
                break;
            } else {
                users.push(_user.userName);
            }
        }

        if (users.length == 0)
            return {
                success: false,
                message: 'No followed users found in that amount of time',
                error: null,
            };

        const userList = await upload(users.join('\n'));
        if (dontBan) {
            chatClient.whisper(user, `${channel}: DRYRUN Follownuke: Caught ${users.length} users | ${userList} ${targetChannel === channel ? '' : `(${targetChannel})`}`);
        } else {
            chatClient.whisper(user, `${channel}: Follownuke: Banning ${users.length} users | ${userList}`);
            for (const _user of users) {
                getClient().ban(channel, _user, `Follownuke by ${user}`);
            }
        }

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new testComand();
