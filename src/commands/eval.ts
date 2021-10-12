import dotenv from 'dotenv';
import * as index from '..';
import { upload } from '../utils/apis/haste';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class evalCommand extends Command {
    name = 'eval';
    description = 'Evaluate Javascript code';
    usage = 'say <code>';
    hidden = true;
    permission = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing code to evaluate',
                error: null,
            };

        let apiClient = index.apiClient;
        let chatClient = index.chatClient;
        let redis = index.redis;

        try {
            let code = args.join(' ');
            if (code.includes('await')) {
                code = `(async () => { ${code} })()`;
            }
            let result = await eval(code);
            if (result?.length > 450) {
                return {
                    success: true,
                    message: await upload(result),
                    error: null,
                };
            } else {
                return {
                    success: true,
                    message: `${result}`,
                    error: null,
                };
            }
        } catch (e) {
            // const errorURL = await upload(e.stack);
            // chatClient.whisper(user, `Error: ${e.message}: ${errorURL}`);

            return {
                success: true,
                message: `Error: ${e.message}`,
                error: null,
            };
        }
    };
}

export const cmd = new evalCommand();
