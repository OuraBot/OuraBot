import { logger } from '..';
import { Channel, IChannel } from '../models/channel.model';

export async function getChannels(bot: string): Promise<string[]> {
    let chs: string[] = [];
    await Channel.find()
        .then((channels) => {
            for (let channel of channels.filter((c: IChannel) => c.bot === process.env.CLIENT_USERNAME)) {
                chs.push(channel.channel);
            }
        })
        .catch((err) => {
            logger.error(err, 'Error fetching channels');
        });

    return chs;
}
