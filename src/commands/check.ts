import dotenv from 'dotenv';
import { SuggestionModel } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class suggestCommand extends Command {
    name = 'check';
    description = 'Check the status of a suggestion.';
    usage = 'check <ID>';
    userCooldown = 5;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        const idToCheck = Number(args[0]);
        if (isNaN(idToCheck))
            return {
                success: false,
                message: 'Invalid suggestion ID',
                error: null,
            };
        let suggestion = await SuggestionModel.findOne({ id: idToCheck });
        console.log(suggestion);
        if (!suggestion) {
            return {
                success: false,
                message: 'Suggestion not found',
                error: null,
            };
        } else {
            return {
                success: true,
                message: `Suggestion ID: ${suggestion.id} ${suggestion.completed ? 'has been completed. ✅ ' : `has not been completed.`} Suggestion: ${suggestion.message}`,
                error: null,
            };
        }
    };
}

export const cmd = new suggestCommand();
