import dotenv from 'dotenv';
import { HelixChannelEmote, UserIdResolvable } from 'twitch/lib';
import { apiClient, redis } from '..';
import { resolveUser } from '../utils/apis/ivr';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { chunkArr } from '../utils/stringManipulation';

dotenv.config();

class testComand extends Command {
    name = 'emotes';
    description = 'Get the Twitch emotes of the channel';
    usage = 'emotes';
    channelCooldown = 5;
    userCooldown = 10;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let redisData = await redis.get(`emotes:${channel}`);
        let channelEmotes: HelixChannelEmote[];
        let channelID: UserIdResolvable;
        if (redisData) {
            channelEmotes = JSON.parse(redisData);
        } else {
            channelID = (await resolveUser(channel.replace('#', ''))).user.id;
            channelEmotes = await apiClient.helix.chat.getChannelEmotes(channelID);
            await redis.set(`emotes:${channel}`, JSON.stringify(channelEmotes), 'EX', 60 * 60 * 12);
        }

        // let channelID = (await resolveUser(channel.replace('#', ''))).user.id;
        // channelEmotes = await apiClient.helix.chat.getChannelEmotes(channelID);
        let sortedEmotes = channelEmotes
            .sort((a, b) => {
                if (a.id < b.id) return -1;
                if (a.id > b.id) return 1;
                return 0;
            })
            .map((e) => e.name);

        let chunkedEmotes = chunkArr(sortedEmotes, 400, ' ').map((chunk) => `Emotes: ${chunk}`);
        console.log(chunkedEmotes);

        return {
            success: true,
            message: chunkedEmotes.length >= 1 ? chunkedEmotes : 'This channel has no sub emotes',
            error: null,
            ignorebanphrase: true,
        };
    };
}

export const cmd = new testComand();
