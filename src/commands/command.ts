import { Channel } from 'discord.js';
import dotenv from 'dotenv';
import { commands, commitDate, commitHash, config, redis } from '..';
import { prettyTime } from '../utils/auroMs';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
dotenv.config();

export type Permissions = 'none' | 'sub' | 'vip' | 'mod' | 'broadcaster';

export class CommandData {
    public channel: string;
    public command: string;
    public offline: boolean;
    public requiredPermission: Permissions;
    public enabled: boolean;
    // public aliases: string[];
}

export class ChannelCommandData {
    public channel: string;
    public commands: { [key: string]: CommandData };
}

class suggestCommand extends Command {
    name = 'command';
    description = 'Manage multiple properties of commands for this channel (see extended description)';
    permission = 7;
    //                                                                                                                                                                                                                                                                                     \n\t\taliases - <comma seperated list> - Set channel aliases for a command (OVERWRITES DEFAULTS)
    extendedDescription = `Available properties:\n\t\toffline - true/false - Make the command only work in offline chat?\n\t\trequiredpermission - None/Sub/VIP/Mod/Broadcaster - Set a custom permission for a command (and above)\n\t\tenabled - true/false - Enable or disable a command`;
    usage = 'command <command> <property> <value>';
    userCooldown = 1;
    channelCooldown = 1;
    disableLocked = true;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        console.table(args);

        if (!args[0])
            return {
                success: false,
                message: 'Missing command to modify (use command name, not alias)',
                error: null,
            };

        if (!args[1])
            return {
                success: false,
                message: 'Missing property to modify',
                error: null,
            };

        if (!args[2])
            return {
                success: false,
                message: 'Missing value to set',
                error: null,
            };

        const botcommands = await commands;
        if (botcommands.has(args[0])) {
            const command: Command = botcommands.get(args[0]);
            if (command.hidden)
                return {
                    success: false,
                    message: 'Command not found',
                    error: null,
                };

            if (command.allLocked)
                return {
                    success: false,
                    message: 'This command can not be modified',
                    error: null,
                };

            const property = args[1].toLowerCase();
            let commandData: ChannelCommandData | string = await redis.get(`ob:properties:${channel}`);
            if (!commandData) {
                commandData = new ChannelCommandData();
                commandData.channel = channel;
                let commandDataObj: CommandData = new CommandData();
                commandDataObj.channel = channel;
                commandDataObj.command = command.name;
                commandData.commands = {};
                commandData.commands[command.name] = commandDataObj;
            } else {
                commandData = JSON.parse(commandData);
                if (!(commandData as ChannelCommandData).commands[command.name]) {
                    (commandData as ChannelCommandData).commands[command.name] = new CommandData();
                    (commandData as ChannelCommandData).commands[command.name].channel = channel;
                    (commandData as ChannelCommandData).commands[command.name].command = command.name;
                }
            }

            switch (property) {
                case 'offline':
                    {
                        if (args[2] === 'true') {
                            (commandData as ChannelCommandData).commands[command.name].offline = true;
                        } else if (args[2] === 'false') {
                            (commandData as ChannelCommandData).commands[command.name].offline = false;
                        } else {
                            return {
                                success: false,
                                message: 'Invalid value (true or false)',
                                error: null,
                            };
                        }
                    }
                    break;

                case 'requiredpermission':
                    {
                        if (!command.allowCustomPermissions)
                            return {
                                success: false,
                                message: 'You cannot change the required permission of this command',
                                error: null,
                            };

                        if (args[2] === 'none') {
                            (commandData as ChannelCommandData).commands[command.name].requiredPermission = 'none';
                        } else if (args[2] === 'sub') {
                            (commandData as ChannelCommandData).commands[command.name].requiredPermission = 'sub';
                        } else if (args[2] === 'vip') {
                            (commandData as ChannelCommandData).commands[command.name].requiredPermission = 'vip';
                        } else if (args[2] === 'mod') {
                            (commandData as ChannelCommandData).commands[command.name].requiredPermission = 'mod';
                        } else if (args[2] === 'broadcaster') {
                            (commandData as ChannelCommandData).commands[command.name].requiredPermission = 'broadcaster';
                        } else {
                            return {
                                success: false,
                                message: 'Invalid value (none/sub/vip/mod/broadcaster)',
                                error: null,
                            };
                        }
                    }

                    break;

                case 'enabled':
                    {
                        if (command.disableLocked)
                            return {
                                success: false,
                                message: 'You cannot disable this command',
                                error: null,
                            };

                        if (args[2] === 'true') {
                            (commandData as ChannelCommandData).commands[command.name].enabled = true;
                        } else if (args[2] === 'false') {
                            (commandData as ChannelCommandData).commands[command.name].enabled = false;
                        } else {
                            return {
                                success: false,
                                message: 'Invalid value (true or false)',
                                error: null,
                            };
                        }
                    }

                    break;

                // case 'aliases':
                //     {
                //         if (command.aliasLocked)
                //             return {
                //                 success: false,
                //                 message: 'You cannot change the aliases of this command ',
                //                 error: null,
                //             };

                //         if (args[2].includes(',')) {
                //             const aliases = args[2].split(',');
                //             (commandData as ChannelCommandData).commands[command.name].aliases = aliases;
                //         } else {
                //             return {
                //                 success: false,
                //                 message: 'Invalid value (comma seperated list)',
                //                 error: null,
                //             };
                //         }
                //     }
                //     break;

                default:
                    return {
                        success: false,
                        message: 'Unknown property',
                        error: null,
                    };
            }

            await redis.set(`ob:properties:${channel}`, JSON.stringify(commandData));
            return {
                success: true,
                message: 'Property set',
                error: null,
            };
        } else {
            return {
                success: false,
                message: `Command not found`,
                error: null,
            };
        }
    };
}

export const cmd = new suggestCommand();
