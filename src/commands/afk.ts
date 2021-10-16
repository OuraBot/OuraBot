import dotenv from 'dotenv';
import { banphraseCheck, redis } from '../index';
import { Afk, Status } from '../models/afk.model';
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
    channelCooldown = 1;
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
                    const newAfk = new Afk({
                        user: user,
                        message: afkMsg,
                        status: Status.AFK,
                        timestamp: new Date(),
                    });
                    newAfk.save();
                    redis.del(`tl:${channel}:afk`);

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
                    const newAfk = new Afk({
                        user: user,
                        message: afkMsg,
                        status: Status.AFK,
                        timestamp: new Date(),
                    });
                    newAfk.save();
                    redis.del(`tl:${channel}:afk`);

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
                    redis.del(`tl:${channel}:afk`);

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
                    redis.del(`tl:${channel}:afk`);

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
                    const newAfk = new Afk({
                        user: user,
                        message: afkMsg,
                        status: Status.EATING,
                        timestamp: new Date(),
                    });
                    newAfk.save();
                    redis.del(`tl:${channel}:afk`);

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
