import dotenv from 'dotenv';
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
        return {
            success: true,
            message: 'asdfasdf',
            error: null,
        };
    };
}

export const cmd = new testComand();
