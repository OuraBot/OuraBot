import dotenv from 'dotenv';
import { chatClient, config, redis } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass, getCommands, PermissionEnum } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
import { CustomCommand } from '../models/command.model';
import axios from 'axios';
dotenv.config();

class suggestCommand extends Command {
    name = 'commands';
    description = 'View all global and custom commands for the channel.';
    usage = 'commands';
    userCooldown = 60;
    channelCooldown = 60;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let data = `Commands for ${channel} | ${process.env.CLIENT_USERNAME} | ${new Date()}\n\n`;
        let prefixed = false;
        CustomCommand.find().then((commands) => {
            for (let command of commands.filter((c) => c.channel === channel.replace('#', ''))) {
                if (!prefixed) {
                    data += `Custom Commands:\n\n`;
                    prefixed = true;
                }
                data += `Command: ${command.command}\nResponse: ${command.response}\nUser Cooldown: ${command.userCooldown}\nChannel Cooldown: ${command.channelCooldown}\n\n`;
            }
        });

        data += `Global Commands:\n\n`;

        let commandMap: any = await getCommands();
        commandMap.forEach((command: Command) => {
            if (!command.hidden) {
                // prettier-ignore
                data += `Command: ${config.prefix}${command.name}\nDescription: ${command.description}\n${command?.extendedDescription ? `Extended Description: ${command.extendedDescription}\n` : ``}${command?.aliases ? `Aliases: ${command.aliases.join(' ')}\n` : ''}Usage: ${command.usage}\n${command.permission ? `Permission: ${PermissionEnum[command.permission]}\n` : ''}${command?.userCooldown ? `User Cooldown: ${command.userCooldown}s\n` : ``}${command?.channelCooldown ? `Channel Cooldown: ${command.channelCooldown}s\n` : ``}\n`;
            }
        });

        data += `\n\nBot made by @AuroR6S`;

        let resp = await axios.post(`https://haste.zneix.eu/documents`, data);
        return {
            success: true,
            message: `View all the commands here: https://haste.zneix.eu/raw/${resp.data.key}`,
            error: null,
            ignorebanphrase: true,
        };
    };
}

export const cmd = new suggestCommand();
