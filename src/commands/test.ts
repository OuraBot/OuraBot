import dotenv from 'dotenv';
import { banphraseCheck } from '..';
import { upload } from '../utils/apis/haste';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { logger } from '..';
import axios from 'axios';

dotenv.config();

class testComand extends Command {
    name = 'test';
    description = 'Just for testing Pepege';
    usage = 'test';
    permission = 32;
    aliases = ['t'];
    hidden = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        const uploadData = await upload(args.join(' '));
        return {
            success: true,
            message: uploadData,
            error: null,
        };
    };
}

export const cmd = new testComand();
