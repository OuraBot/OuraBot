import dotenv from 'dotenv';
import { banphraseCheck, redis } from '../index';
import { Status, getUserAfk, clearUserAfk, setUserAfk } from '../utils/afkManager';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

const foodEmojis = [
    '🍋',
    '🍞',
    '🥐',
    '🥖',
    '🥨',
    '🥯',
    '🥞',
    '🧀',
    '🍖',
    '🍗',
    '🥩',
    '🥓',
    '🍔',
    '🍟',
    '🍕',
    '🌭',
    '🥪',
    '🌮',
    '🌯',
    '🥙',
    '🍳',
    '🥘',
    '🍲',
    '🥣',
    '🥗',
    '🍿',
    '🥫',
    '🍱',
    '🍘',
    '🍙',
    '🍚',
    '🍛',
    '🍜',
    '🍝',
    '🍠',
    '🍢',
    '🍣',
    '🍤',
    '🍥',
    '🍡',
    '🥟',
    '🥠',
    '🥡',
    '🍦',
    '🍧',
    '🍨',
    '🍩',
    '🍪',
    '🎂',
    '🍰',
    '🥧',
    '🍫',
    '🍬',
    '🍭',
    '🍮',
    '🍯',
];

class suggestCommand extends Command {
    name = 'afk';
    description = 'Set your status as afk!';
    usage = 'afk <reason?>';
    extendedDescription = `Use the "lurk" or "gn" alias for their corrosponding statuses.`;
    userCooldown = 10;
    aliases = ['lurk', 'gn', 'brb', 'food'];
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

                case 'brb':
                    reason = '(no message)';
                    break;

                case 'food':
                    reason = `OpieOP ${foodEmojis[Math.floor(Math.random() * foodEmojis.length)]}`;
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
                    setUserAfk(user, Status.AFK, afkMsg);

                    return {
                        success: true,
                        message: `${user} is now afk: ${(await banphraseCheck(afkMsg, channel)) ? '[Banphrased]' : afkMsg}`,
                        error: null,
                        noping: true,
                    };
                }
                break;

            case 'brb':
                {
                    afkMsg = `${reason}`;
                    setUserAfk(user, Status.AFK, afkMsg);

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
                    setUserAfk(user, Status.SLEEP, afkMsg);

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
                    setUserAfk(user, Status.LURK, afkMsg);

                    return {
                        success: true,
                        message: `${user} is now lurking: ${(await banphraseCheck(afkMsg, channel)) ? '[Banphrased]' : afkMsg}`,
                        error: null,
                        noping: true,
                    };
                }
                break;

            case 'food':
                {
                    afkMsg = `${reason}`;
                    setUserAfk(user, Status.EATING, afkMsg);

                    return {
                        success: true,
                        message: `${user} is now eating: ${(await banphraseCheck(afkMsg, channel)) ? '[Banphrased]' : afkMsg}`,
                        error: null,
                        noping: true,
                    };
                }
                break;
        }
    };
}

export const cmd = new suggestCommand();
