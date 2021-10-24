import dotenv from 'dotenv';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'suggest';
    description = 'Suggest a feature or report a bug to the developer';
    usage = 'suggest <suggestion/bug report>';
    aliases = ['ob_suggest'];
    userCooldown = 10;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let ID = await createNewSuggestion(user, args.join(' '));

        return {
            success: true,
            message: `Your suggestion has been noted! You will be notified with any changes. (ID: ${ID})`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
