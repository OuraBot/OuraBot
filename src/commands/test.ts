import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import dotenv from 'dotenv';
import { Block } from '../utils/blockManager';
import { apiClient, apiClient2, config, discordManager, redis } from '..';
import { getBttvChannelEmotes, getFfzChannelEmotes } from '../utils/channelEmotes';
import { Command, CommandReturnClass, getPermissions, PermissionEnum } from '../utils/commandClass';
import { Discord } from '../utils/discord';
import { Channel } from '../models/channel.model';

dotenv.config();

class testComand extends Command {
    name = 'test';
    description = 'Just for testing Pepege';
    usage = 'test';
    permission = 33;
    aliases = ['t'];
    hidden = true;
    execute = async (user: string, channel: string, args: string[], cmdMsg: string, msg: TwitchPrivateMessage): Promise<CommandReturnClass> => {
        let badChannels = args.split(',');

        let i = 0;
        // remove all bad channels from the DB
        for (let chnl of badChannels) {
            // find and delete but ignore case
            await Channel.find({ channel: new RegExp(`^${chnl}$`, 'i') }).deleteMany();

            const redisData = await redis.get(`ob:blockeddata:${chnl}`);
            let blockedData: Block = null;

            if (redisData) {
                blockedData = JSON.parse(redisData);
            } else {
                blockedData = {
                    user: chnl,
                    blockedAll: true,
                    commands: [],
                };
            }

            blockedData.blockedAll = true;

            await redis.set(`ob:blockeddata:${chnl}`, JSON.stringify(blockedData));

            i++;
        }

        return {
            success: true,
            message: `${i} channels removed and blocked`,
            error: null,
        };
    };
}

export const cmd = new testComand();
