import dotenv from 'dotenv';
import { redis } from '..';
import { CustomCommand } from '../models/command.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class testComand extends Command {
    name = 'command';
    description = 'Add or remove custom commands';
    usage = 'command <add|remove> <command> <response> <channel cooldown?> <user cooldown?>';
    extendedDescription = `Use {user} and {channel} for their respective values. Use GET,INCR{COUNTERNAME} to either get or increment a counter - doesn't work with fetchURL. Use the !set command to chagne a value.`;
    permission = 39;
    userCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing subcommand (add,remove)',
                error: null,
            };

        if (args[0] === 'add') {
            if (!args[1])
                return {
                    success: false,
                    message: 'Missing custom command name',
                    error: null,
                };
            if (!args[2])
                return {
                    success: false,
                    message: 'Missing custom command response',
                    error: null,
                };

            let commandName = args[1];

            if (commandName.length > 20)
                return {
                    success: false,
                    message: 'Custom command name must be less than 20 characters',
                    error: null,
                };

            // remove the first 2 elements of args
            args.splice(0, 2);

            let userCooldown = Number(args[args.length - 1]);
            if (isNaN(userCooldown)) {
                userCooldown = 5;
            } else {
                args.pop();
            }

            let channelCooldown = Number(args[args.length - 1]);
            if (isNaN(channelCooldown)) {
                channelCooldown = 5;
            } else {
                args.pop();
            }

            let commandResponse = args.join(' ');
            if (commandResponse.length > 400)
                return {
                    success: false,
                    message: 'Custom command response must be less than 400 characters',
                    error: null,
                };

            if (!commandResponse)
                return {
                    success: false,
                    message: 'Missing custom command response',
                    error: null,
                };

            let newCommand = new CustomCommand({
                channel: channel.replace('#', ''),
                command: commandName,
                response: commandResponse,
                userCooldown: userCooldown,
                channelCooldown: channelCooldown,
            });

            await newCommand.save();
            redis.del(`tl:${channel}:customcommands`);
            return {
                success: true,
                message: `Custom command "${commandName}" with a user cooldown of ${userCooldown}s and channel cooldown of ${channelCooldown}s`,
                error: null,
            };
        } else if (args[0] === 'remove') {
            if (!args[1]) {
                return {
                    success: false,
                    message: 'Missing custom command name',
                    error: null,
                };
            }

            let commandName = args[1];
            await CustomCommand.findOneAndRemove({ command: commandName });
            redis.del(`tl:${channel}:customcommands`);
            return {
                success: true,
                message: `Custom command "${commandName}" removed`,
                error: null,
            };
        } else {
            return {
                success: false,
                message: 'Invalid subcommand (add,remove)',
                error: null,
            };
        }
    };
}

export const cmd = new testComand();
