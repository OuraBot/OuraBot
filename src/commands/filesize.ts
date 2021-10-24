import axios from 'axios';
import dotenv from 'dotenv';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'filesize';
    description = 'Get the filesize of a raw file';
    usage = 'filesize <file url>';
    hidden = true;
    permission = 33;
    userCooldown = 5;
    channelCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing file',
                error: null,
            };

        let resp;
        try {
            resp = await axios.get(args[0]);
        } catch (e) {
            return {
                success: false,
                message: 'Error while fetching the specified URL',
                error: null,
            };
        }

        // https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
        // https://stackoverflow.com/questions/2219526/how-many-bytes-in-a-javascript-string

        let fileSize;
        let bytes: number = Buffer.byteLength(resp.data, 'utf8');
        if (bytes === 0) fileSize = '0 Bytes';

        const k = 1024;
        const dm = 2 < 0 ? 0 : 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        fileSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        let splitLines = resp.data.split('\n');

        return {
            success: true,
            message: `${fileSize} - ${splitLines.length} lines. This would take about ${splitLines.length / 10} seconds to say`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
