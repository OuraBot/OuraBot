import { Channel, IChannel } from '../models/channel.model';
import { error } from './logger';

export async function getChannels(bot: string): Promise<string[]> {
    let chs: string[] = [];
    await Channel.find()
        .then((channels) => {
            for (let channel of channels.filter((c: IChannel) => c.bot === process.env.CLIENT_USERNAME)) {
                chs.push(channel.channel);
            }
        })
        .catch((err) => {
            error(err, ['Caught error in fetchChannels.ts']);
            console.log(err);
        });

    return chs;
}
