import dotenv from 'dotenv';
import { Afk, Status } from '../models/afk.model';
import { SuggestionModel } from '../models/suggestion.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { banphraseCheck } from '../index';
dotenv.config();

class suggestCommand extends Command {
    name = 'afk';
    description = 'Set your status as afk!';
    usage = 'afk <reason?>';
    extendedDescription = `Use the "lurk" or "gn" alias for their corrosponding statuses.`;
    userCooldown = 10;
    aliases = ['lurk', 'gn'];
    execute = async (user: string, channel: string, args: string[], cmdMsg: string): Promise<CommandReturnClass> => {
        let reason: string;
        if (!args[0]) {
            switch (cmdMsg) {
                case 'gn':
                    reason = '🛌';
                    break;

                case 'lurk':
                    reason = '';
                    break;

                case 'afk':
                    reason = '(no message)';
                    break;
            }
        } else {
            reason = args.join(' ');
        }

        if (reason.length > 400)
            return {
                success: false,
                message: 'AFK message is too long',
                error: null,
            };

        let afkMsg: string;
        switch (cmdMsg) {
            case 'afk':
                {
                    afkMsg = `${reason}`;
                    const newAfk = new Afk({
                        user: user,
                        message: afkMsg,
                        status: Status.AFK,
                        timestamp: new Date(),
                    });
                    newAfk.save();

                    return {
                        success: true,
                        message: `${user} is now afk: ${(await banphraseCheck(afkMsg, channel)) ? '[Banphrased]' : afkMsg}`,
                        error: null,
                        noping: true,
                    };
                }
                break;

            case 'gn':
                {
                    afkMsg = `${reason} 💤`;
                    const newAfk = new Afk({
                        user: user,
                        message: afkMsg,
                        status: Status.SLEEP,
                        timestamp: new Date(),
                    });
                    newAfk.save();

                    return {
                        success: true,
                        message: `${user} is now sleeping: ${(await banphraseCheck(afkMsg, channel)) ? '[Banphrased]' : afkMsg}`,
                        error: null,
                        noping: true,
                    };
                }
                break;

            case 'lurk':
                {
                    afkMsg = `${reason} 👥`;
                    const newAfk = new Afk({
                        user: user,
                        message: afkMsg,
                        status: Status.LURK,
                        timestamp: new Date(),
                    });
                    newAfk.save();

                    return {
                        success: true,
                        message: `${user} is now lurking: ${(await banphraseCheck(afkMsg, channel)) ? '[Banphrased]' : afkMsg}`,
                        error: null,
                        noping: true,
                    };
                }
                break;
        }
    };
}

export const cmd = new suggestCommand();
