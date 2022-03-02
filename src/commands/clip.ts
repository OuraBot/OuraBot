import axios from 'axios';
import dotenv from 'dotenv';
import { apiClient, apiClient2, chatClient } from '..';
import { Clip } from '../models/clip.model';
import { clipInfo } from '../utils/apis/ivr';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'clip';
    description = 'Clip the last 30 seconds and send it to the Discord';
    usage = 'clip <title>';
    userCooldown = 15;
    channelCooldown = 15;
    allowCustomPermissions = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let discordData: { url: string };
        Clip.find().then(async (clips) => {
            discordData = clips.filter((c) => c.channel === channel.replace('#', ''))[0];
        });

        let streamResp = await apiClient.streams.getStreamByUserName(channel.replace('#', ''));
        if (streamResp == null)
            return {
                success: false,
                message: 'This channel is currently offline FailFish',
                error: null,
            };

        chatClient.say(channel, `@${user}, GivePLZ Creating your clip...`);
        let clippedResp = await apiClient2.clips.createClip({
            channelId: streamResp.userId,
            createAfterDelay: true,
        });

        await new Promise((r) => setTimeout(r, 5000));
        let getClipResp = await apiClient.clips.getClipById(clippedResp);

        if (getClipResp == null) {
            chatClient.say(channel, `@${user}, there was an error while creating your clip, give me a few more seconds Jebaited`);
            clippedResp = await apiClient2.clips.createClip({
                channelId: streamResp.userId,
                createAfterDelay: true,
            });
            await new Promise((r) => setTimeout(r, 5000 * 2));
            getClipResp = await apiClient.clips.getClipById(clippedResp);
        }

        if (getClipResp == null)
            return {
                success: false,
                message: 'There was an error while creating your clip again. Try running the command again FailFish',
                error: null,
            };

        let clipRes;
        let bestClip;

        clipRes = await clipInfo(clippedResp);
        if (clipRes.error) {
            let clipTitle: string = args[0] ? `\n${args.join(' ').replace('@', '')}\n\n` : `\n\n`;
            axios.post(discordData.url, {
                content: `**${streamResp.userName}** playing ${streamResp.gameName} clipped by **${user}**!${clipTitle}<https://clips.twitch.tv/${clippedResp}>`,
            });
        } else {
            bestClip = clipRes.qualities[clipRes.qualities.length - 1];

            let clipTitle: string = args[0] ? `\n${args.join(' ').replace('@', '')}\n\n` : `\n\n`;
            axios.post(discordData.url, {
                content: `**${streamResp.userName}** playing ${streamResp.gameName} clipped by **${user}**!${clipTitle}<https://clips.twitch.tv/${clippedResp}>\n${bestClip.sourceURL}${clipRes.clipKey}`,
            });
        }

        return {
            success: true,
            message: 'Your clip has been sent to the Discord SeemsGood',
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
