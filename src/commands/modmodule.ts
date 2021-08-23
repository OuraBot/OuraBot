import dotenv from 'dotenv';
import { redis } from '..';
import { Module } from '../models/module.model';
import { Command, CommandReturnClass } from '../utils/commandClass';

dotenv.config();

export enum moduleEnum {
    ASCII = 'ascii',
    LINKS = 'links',
    WEEB = 'weeb',
}

class testComand extends Command {
    name = 'modmodule';
    description = 'Manage moderation modules (ascii,links,weeb)';
    usage = 'modmodule <module (ascii,links,weeb)> <timeout in seconds (set 0 for off)>';
    permission = 4;
    channelCooldown = 5;
    userCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing module (ascii,links,weeb)',
                error: null,
            };

        // check if args[0] matches moduleEnum
        if (!Object.values(moduleEnum).includes(args[0] as moduleEnum))
            return {
                success: false,
                message: 'Invalid module',
                error: null,
            };

        if (!args[1])
            return {
                success: false,
                message: 'Missing timeout length (in seconds)',
                error: null,
            };

        let timeoutLength = Number(args[1]);

        if (isNaN(timeoutLength))
            return {
                success: false,
                message: 'Timeout length must be a number',
                error: null,
            };

        if (timeoutLength < 0)
            return {
                success: false,
                message: 'Timeout length must be greater than 0',
                error: null,
            };

        if (timeoutLength > 3600 * 24 * 14)
            return {
                success: false,
                message: 'Timeout length must be less than 14 days',
                error: null,
            };

        let module = args[0];

        const modules = (await Module.find()).filter((m) => m.module === module);
        if (modules.length === 0) {
            if (timeoutLength === 0)
                return {
                    success: false,
                    message: `Module, "${module}" not found in database so there is no need to set timeout to 0.`,
                    error: null,
                };

            const newModule = new Module({
                module: module,
                channel: channel.replace('#', ''),
                timeout: timeoutLength,
            });

            newModule.save();

            redis.del(`tl:${channel}:module`);

            return {
                success: true,
                message: `Module: "${module}" added`,
                error: null,
            };
        } else {
            if (timeoutLength === 0) {
                await modules[0].remove();

                return {
                    success: true,
                    message: `Module: "${module}" removed`,
                    error: null,
                };
            } else {
                await modules[0].update({
                    timeout: timeoutLength,
                });

                return {
                    success: true,
                    message: `Module: "${module}" updated`,
                    error: null,
                };
            }
        }
    };
}

export const cmd = new testComand();
