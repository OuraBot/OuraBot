import axios from 'axios';
import dotenv from 'dotenv';
import { redis } from '..';
import { prettyTime } from '../utils/auroMs';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'ddoi';
    description = 'Fetch either a random or latest DDOI video';
    usage = 'ddoi <random,latest>';
    userCooldown = 5;
    channelCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (args[0] === 'random') {
            let redisData: any = await redis.get(`DDOIVIDEOS`);
            if (redisData) {
                redisData = JSON.parse(redisData);
                let randomNumber = Math.floor(Math.random() * redisData.length);
                return {
                    success: true,
                    message: `Random video from DDOI: "${redisData[randomNumber].title}" - ${redisData[randomNumber].url} [${prettyTime(
                        Date.now() - new Date(redisData[randomNumber].publishedAt).getTime(),
                        false
                    )} ago]`,
                    error: null,
                    ignorebanphrase: true,
                };
            } else {
                let data: any = [];
                async function getVideos(cursor?: any): Promise<any> {
                    const resp = await axios.get(
                        `https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBE_KEY}&channelId=UCdC0An4ZPNr_YiFiYoVbwaw&part=snippet,id&order=date&maxResults=100${
                            cursor ? `&pageToken=${cursor}` : ''
                        }`
                    );
                    data.push(...resp.data.items);
                    if (resp.data?.nextPageToken) {
                        return getVideos(resp.data.nextPageToken);
                    }
                }

                await getVideos();
                data = data.map((video: { snippet: { title: any; publishedAt: string }; id: { videoId: any } }) => {
                    return {
                        title: unescapeHTML(video.snippet.title),
                        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                        publishedAt: video.snippet.publishedAt,
                    };
                });

                await redis.set(`DDOIVIDEOS`, JSON.stringify(data), 'EX', 60 * 60 * 24 * 7);

                let randomNumber = Math.floor(Math.random() * data.length);
                return {
                    success: true,
                    message: `Random video from DDOI: "${data[randomNumber].title}" - ${data[randomNumber].url} [${prettyTime(
                        Date.now() - new Date(data[randomNumber].publishedAt).getTime(),
                        false
                    )} ago]`,
                    error: null,
                    ignorebanphrase: true,
                };
            }
        } else if (args[0] === 'latest') {
            let video: any = await axios.get(`https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBE_KEY}&channelId=UCdC0An4ZPNr_YiFiYoVbwaw&part=snippet,id&order=date&maxResults=1`);
            video = video.data.items[0];
            return {
                success: true,
                message: `Latest video from DDOI: "${unescapeHTML(video.snippet.title)}" - https://www.youtube.com/watch?v=${video.id.videoId} [${prettyTime(
                    Date.now() - new Date(video.snippet.publishedAt).getTime(),
                    false
                )} ago]`,
                error: null,
                ignorebanphrase: true,
            };
        } else {
            return {
                success: false,
                message: 'Missing subargument (random,latest)',
                error: null,
            };
        }
    };
}

export const cmd = new suggestCommand();

export const unescapeHTML = (str: string) =>
    str.replace(
        /&amp;|&lt;|&gt;|&#39;|&quot;/g,
        (tag) =>
            ({
                '&amp;': '&',
                '&lt;': '<',
                '&gt;': '>',
                '&#39;': "'",
                '&quot;': '"',
            }[tag] || tag)
    );
