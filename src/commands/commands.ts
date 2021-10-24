import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import dotenv from 'dotenv';
import { config, redis } from '..';
import { CustomCommand, ICustomCommand } from '../models/command.model';
import { upload } from '../utils/apis/haste';
import { Command, CommandReturnClass, getCommands, getPermissions, hasPermisison } from '../utils/commandClass';
import { ChannelCommandData } from './command';
dotenv.config();

class suggestCommand extends Command {
    name = 'commands';
    description = 'View all global and custom commands for the channel.';
    usage = 'commands';
    userCooldown = 30;
    channelCooldown = 15;
    execute = async (user: string, channel: string, args: string[], cmdMsg: string, msg: TwitchPrivateMessage): Promise<CommandReturnClass> => {
        let data = `Commands for ${channel} | Oura_Bot | ${new Date()}\n\n`;

        const customCommands: ICustomCommand[] = await CustomCommand.find({ channel: channel.replace('#', '') });

        if (customCommands.length > 0) data += `Channel Commands:\n\n`;
        for (let command of customCommands) {
            data += `Command: ${command.command}\nResponse: ${command.response}\nUser Cooldown: ${command.userCooldown}\nChannel Cooldown: ${command.channelCooldown}\n\n`;
        }

        data += `----------------------------------------\n\nGlobal Commands:\n\n`;

        let channelPrefix = await redis.get(`ob:${channel}:prefix`);
        if (channelPrefix) {
            channelPrefix = channelPrefix;
        } else {
            channelPrefix = process.env.DEBUG === 'TRUE' ? config.debugprefix : config.prefix;
        }

        interface CommandPermission {
            command: string;
            msg: string;
            hasPermission: boolean;
            hidden: boolean;
        }

        let commandsPermissions: CommandPermission[] = [];

        let disabledCommands: string[] = [];
        let commandProperties: ChannelCommandData | string = await redis.get(`ob:properties:${channel}`);
        if (commandProperties) {
            commandProperties = JSON.parse(commandProperties);
            for (let command in (commandProperties as ChannelCommandData).commands) {
                if (!(commandProperties as ChannelCommandData).commands[command].enabled) {
                    disabledCommands.push(command);
                }
            }
        }

        let commandMap: any = await getCommands();
        commandMap.forEach((command: Command) => {
            if (command.permission) {
                commandsPermissions.push({
                    command: command.name,
                    msg: `Command: ${channelPrefix}${command.name}\nDescription: ${command.description}\n${
                        command?.extendedDescription ? `Extended Description: ${command.extendedDescription}\n` : ``
                    }${command?.aliases ? `Aliases: ${command.aliases.join(' ')}\n` : ''}Usage: ${command.usage}\n${
                        command.permission ? `Permission (any of): ${getPermissions(command.permission).join(' ')}\n` : ''
                    }${command?.userCooldown ? `User Cooldown: ${command.userCooldown}s\n` : ``}${command?.channelCooldown ? `Channel Cooldown: ${command.channelCooldown}s\n` : ``}`,
                    hasPermission: hasPermisison(command.permission, user, channel, msg),
                    hidden: command.hidden || false,
                });
            } else {
                commandsPermissions.push({
                    command: command.name,
                    msg: `Command: ${channelPrefix}${command.name}\nDescription: ${command.description}\n${
                        command?.extendedDescription ? `Extended Description: ${command.extendedDescription}\n` : ``
                    }${command?.aliases ? `Aliases: ${command.aliases.join(' ')}\n` : ''}Usage: ${command.usage}\n${
                        command.permission ? `Permission (any of): ${getPermissions(command.permission).join(' ')}\n` : ''
                    }${command?.userCooldown ? `User Cooldown: ${command.userCooldown}s\n` : ``}${command?.channelCooldown ? `Channel Cooldown: ${command.channelCooldown}s\n` : ``}`,
                    hasPermission: true,
                    hidden: command.hidden || false,
                });
            }
        });

        commandsPermissions = commandsPermissions.filter((command: CommandPermission) => {
            if (disabledCommands.includes(command.command)) {
                return false;
            }
            if (command.hidden) {
                if (command.hasPermission) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        });

        data += commandsPermissions.map((command: CommandPermission) => command.msg).join('\n');

        data += `\n\nBot made by @AuroR6S`;

        let resp = await upload(data);
        return {
            success: true,
            message: `View all the commands here: ${resp}`,
            error: null,
            ignorebanphrase: true,
        };
    };
}

export const cmd = new suggestCommand();
