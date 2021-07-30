import dotenv from 'dotenv';
import { Command, CommandReturnClass } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'test';
    description = 'Just for testing Pepege';
    usage = 'test';
    permission = 4;
    aliases = ['t'];
    hidden = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        return {
            success: true,
            message: 'PagManHop TEST',
            error: null,
        };
    };
}

export const cmd = new testComand();
