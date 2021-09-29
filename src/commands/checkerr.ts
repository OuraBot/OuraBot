import dotenv from 'dotenv';
import { chatClient } from '..';
import { ErrorModel, IError } from '../models/error.model';
import { upload } from '../utils/apis/haste';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'checkerr';
    description = 'Check an error by ID';
    aliases = ['checkerror'];
    permission = 32;
    hidden = true;
    usage = 'checkerr <ID>';
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        const idToCheck = Number(args[0]);
        if (isNaN(idToCheck))
            return {
                success: false,
                message: 'Invalid error ID',
                error: null,
            };
        let error: IError = await ErrorModel.findOne({ id: idToCheck });
        console.log(error);
        if (!error) {
            return {
                success: false,
                message: 'Error not found',
                error: null,
            };
        } else {
            const formattedString = `Error #${error.id} - ${error?.createdAt}\n\nArgs:${error.args.join('\n')}\n\nError:\n${error.error}`;
            const url = await upload(formattedString);
            chatClient.whisper(user, `Error #${error.id}: ${url}`);
            return {
                success: true,
                message: `I whispered you the error details.`,
                error: null,
            };
        }
    };
}

export const cmd = new suggestCommand();
