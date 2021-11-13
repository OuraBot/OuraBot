import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import dotenv from 'dotenv';
import { config, discordManager } from '..';
import { getBttvChannelEmotes, getFfzChannelEmotes } from '../utils/channelEmotes';
import { Command, CommandReturnClass, getPermissions, PermissionEnum } from '../utils/commandClass';
import { Discord } from '../utils/discord';

dotenv.config();

class testComand extends Command {
    name = 'test';
    description = 'Just for testing Pepege';
    usage = 'test';
    permission = 33;
    aliases = ['t'];
    hidden = true;
    execute = async (user: string, channel: string, args: string[], cmdMsg: string, msg: TwitchPrivateMessage): Promise<CommandReturnClass> => {
        console.log(await getBttvChannelEmotes(channel), 'bttv');
        console.log(await getFfzChannelEmotes(channel), 'ffz');

        return {
            success: true,
            message: `asdfasdf`,
            error: null,
        };
    };
}

export const cmd = new testComand();
