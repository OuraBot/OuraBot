import dotenv from 'dotenv';
import { banphraseCheck } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'test';
    description = 'Just for testing Pepege';
    usage = 'test';
    permission = 32;
    aliases = ['t'];
    hidden = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let sdfg = await banphraseCheck(args.join(' '), channel.replace('#', ''));
        return {
            success: true,
            message: `${sdfg}`,
            error: null,
        };
    };
}

export const cmd = new testComand();
