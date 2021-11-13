import dotenv from 'dotenv';
import { cancelSpamChannels, chatClient } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getClient } from '../utils/spamClients';
import { sanitizeMessage } from '../utils/stringManipulation';
import { addTask, removeTask } from '../utils/taskManager';
dotenv.config();

const poorColorList = ['red', 'firebrick', 'orangered', 'chocolate', 'goldenrod', 'yellowgreen', 'green', 'seasgreen', 'springgreen', 'dodgerblue', 'blue', 'blueviolet', 'hotpink'];

class spamCommand extends Command {
    name = 'spam';
    description = 'Spam a message';
    usage = 'spam <spam count> <text>';
    requireFastLimits = true;
    permission = 419;
    allowCustomPermissions = true;
    userCooldown = 30;
    channelCooldown = 15;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (args.length < 2)
            return {
                success: false,
                message: 'Not enough arguments',
                error: null,
                reducedcooldown: 1,
            };

        let spamCount = parseInt(args[0]);
        let spamText = sanitizeMessage(args.slice(1).join(' '));

        let isFast = false;
        if (spamText.includes('--fast')) {
            isFast = true;
            spamText = spamText.replace('--fast', '');
        }

        if (isNaN(spamCount))
            return {
                success: false,
                message: 'Invalid spam count',
                error: null,
                reducedcooldown: 1,
            };

        if (spamCount > 100)
            return {
                success: false,
                message: 'Spam count too high (100 max)',
                error: null,
                reducedcooldown: 1,
            };

        if (spamCount < 1)
            return {
                success: false,
                message: 'Spam count too low (1 min)',
                error: null,
                reducedcooldown: 1,
            };

        addTask(channel, this.name);

        if (isFast) {
            for (let i = 0; i < spamCount; i++) {
                await getClient().say(channel, spamText);
            }
        } else {
            for (let i = 0; i < spamCount; i++) {
                let color = poorColorList[i % poorColorList.length];

                await new Promise((resolve) => setTimeout(resolve, 100));
                if (cancelSpam(channel)) {
                    await chatClient.say(channel, '/color dodgerblue');
                    break;
                }

                await chatClient.say(channel, `/color ${color}`);
                chatClient.say(channel, `/me ${spamText}`);

                if (i === spamCount - 1) await chatClient.say(channel, '/color dodgerblue');
            }
        }
        removeTask(channel, this.name);

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new spamCommand();

function cancelSpam(channel: string) {
    if (cancelSpamChannels.has(channel)) {
        cancelSpamChannels.delete(channel);
        return true;
    } else {
        return false;
    }
}
