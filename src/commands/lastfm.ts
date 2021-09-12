import dotenv from 'dotenv';
import { chatClient } from '..';
import { Channel } from '../models/channel.model';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
import { error } from '../utils/logger';
import { getNowPlaying } from '../utils/apis/lastfm';
import { getBestEmote } from '../utils/channelEmotes';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class lastfmCommand extends Command {
    name = 'lastfmsong';
    description = 'Gets the current playing song from the streamers Last.fm profile.';
    usage = 'lastfmsong';
    userCooldown = 10;
    channelCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let song = await getNowPlaying(channel);

        if (!song.success) {
            return {
                success: false,
                message: `${song.result}`,
                error: null,
            };
        } else {
            let preferredEmote = await getBestEmote(channel, ['forsenPls', 'Jammer', 'Jammies', 'forsenDiscoSnake', 'pepeJAM'], '🎶');
            if (song.artist === 'Kanye West') preferredEmote = await getBestEmote(channel, ['TriKool', 'TriDance'], '🎶');

            if (song.result) {
                return {
                    success: true,
                    message: `${obfuscateName(song.LastfmUsername)}'s most recent track is: ${song.result} - ${song.artist} ${preferredEmote.bestAvailableEmote}`,
                    error: null,
                };
            } else {
                return {
                    success: true,
                    message: `No recent tracks found for ${obfuscateName(channel.replace('#', ''))}`,
                    error: null,
                };
            }
        }
    };
}

export const cmd = new lastfmCommand();
