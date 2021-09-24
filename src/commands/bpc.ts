import dotenv from 'dotenv';
import { banphraseCheck } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'bpc';
    description = 'ban phrase checking Okayga';
    usage = 'test';
    permission = 64;
    hidden = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let data = await banphraseCheck(args.join(' '), channel);
        return {
            success: true,
            message: `${args.join(' ')} had a banphrase result of: ${data}`,
            error: null,
            ignorebanphrase: true,
        };
    };
}

export const cmd = new testComand();
