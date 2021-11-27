import dotenv from 'dotenv';
import { chatClient } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getClient } from '../utils/spamClients';
import { addTask, removeTask } from '../utils/taskManager';
dotenv.config();

// const poorColorList = ['red', 'firebrick', 'orangered', 'chocolate', 'goldenrod', 'yellowgreen', 'green', 'seasgreen', 'springgreen', 'dodgerblue', 'blue', 'blueviolet', 'hotpink'];

class pyramidCommand extends Command {
    name = 'pyramid';
    description = 'Make a pyramid';
    usage = 'pyramid <width> <emote/text>';
    userCooldown = 30;
    channelCooldown = 15;
    requireFastLimits = true;
    permission = 7;
    allowCustomPermissions = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let width: any = args[0];
        args.shift();
        let emote = args.join(' ') + ' ';

        if (!width || !emote)
            return {
                success: false,
                message: 'Missing width or emote/text',
                error: null,
                reducedcooldown: 1,
            };

        width = parseInt(width);
        if (isNaN(width)) {
            return {
                success: false,
                message: 'Provided width is not a number',
                error: null,
                reducedcooldown: 1,
            };
        }

        if (width < 2 || width > 100)
            return {
                success: false,
                message: 'Width must be between 2 and 100',
                error: null,
                reducedcooldown: 1,
            };

        if (emote.length * width > 490)
            return {
                success: false,
                message: 'Emote/text is too long for the given width',
                error: null,
                reducedcooldown: 1,
            };

        addTask(channel, this.name);

        // first half
        for (let i = 0; i < width; i++) {
            // let color = poorColorList[i % poorColorList.length];
            // await getClient().say(channel, `/color ${color}`);
            getClient().say(channel, '/me ' + emote.repeat(i + 1).replace(/^(\.|\/|!)/, ''));
            await new Promise((resolve) => setTimeout(resolve, 75));
        }

        // second half
        for (let i = width; i > 0; i--) {
            // let color = poorColorList[i % poorColorList.length];
            // await getClient().say(channel, `/color ${color}`);
            if (i != width) getClient().say(channel, '/me ' + emote.repeat(i).replace(/^(\.|\/|!)/, ''));
            await new Promise((resolve) => setTimeout(resolve, 75));

            // if (i == 1) {
            //     await getClient().say(channel, `/color dodgerblue`);
            // }
        }

        removeTask(channel, this.name);

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new pyramidCommand();
