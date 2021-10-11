import dotenv from 'dotenv';
import { chatClient } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

const poorColorList = ['red', 'firebrick', 'orangered', 'chocolate', 'goldenrod', 'yellowgreen', 'green', 'seasgreen', 'springgreen', 'dodgerblue', 'blue', 'blueviolet', 'hotpink'];

class spamCommand extends Command {
    name = 'spam';
    description = 'Spam a message';
    usage = 'spam <spam count> <text>';
    permission = 64;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (args.length < 2)
            return {
                success: false,
                message: 'Not enough arguments',
                error: null,
            };

        let spamCount = parseInt(args[0]);
        let spamText = args
            .slice(1)
            .join(' ')
            .replace(/^(\.|\/)/, '');
        if (isNaN(spamCount))
            return {
                success: false,
                message: 'Invalid spam count',
                error: null,
            };

        if (spamCount > 1000)
            return {
                success: false,
                message: 'Spam count too high (1000 max)',
                error: null,
            };

        if (spamCount < 1)
            return {
                success: false,
                message: 'Spam count too low (1 min)',
                error: null,
            };

        for (let i = 0; i < spamCount; i++) {
            let color = poorColorList[i % poorColorList.length];
            await chatClient.say(channel, `/color ${color}`);
            chatClient.say(channel, `/me ${spamText}`);

            if (i === spamCount - 1) await chatClient.say(channel, '/color dodgerblue');
        }

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new spamCommand();
