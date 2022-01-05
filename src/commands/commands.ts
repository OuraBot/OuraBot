import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import dotenv from 'dotenv';
import { config, redis } from '..';
import { CustomCommand, ICustomCommand } from '../models/command.model';
import { upload } from '../utils/apis/haste';
import { Command, CommandReturnClass, getCommands, getPermissions, hasPermisison } from '../utils/commandClass';
import { ChannelCommandData, CommandData } from './command';
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';
dotenv.config();

class suggestCommand extends Command {
    name = 'commands';
    description = 'View all global and custom commands for the channel.';
    usage = 'commands';
    userCooldown = 30;
    channelCooldown = 15;
    execute = async (user: string, channel: string, args: string[], cmdMsg: string, msg: TwitchPrivateMessage): Promise<CommandReturnClass> => {
        if (!process.env.MRAURO_DEV_KEY) throw new Error('MRAURO_DEV_KEY is not set in .env');

        // prettier-ignore
        let HTML = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700" rel="stylesheet" />
        <title>OuraBot Commands</title>
    </head>
    <body>
        <h1>Commands for ${channel.replace('#', '')}</h1>
        <p>Below are all of the commands available in ${channel}</p>
    </body>

    <h2>Global Commands</h2>
    <table>
        <tr>
            <th>Command</th>
            <th>Usage</th>
            <th>Permission</th>
            <th>User Cooldown</th>
            <th>Channel Cooldown</th>
            <th>Aliases</th>
            <th>Description</th>
            <th>Extended Description</th>
            <th>Enabled</th>
        </tr>
`;
        let useCustomProperties = false;
        let commandProperties: ChannelCommandData | string = await redis.get(`ob:properties:${channel}`);
        if (commandProperties) {
            commandProperties = JSON.parse(commandProperties);
            useCustomProperties = true;
        }

        let commandMap = await getCommands();
        commandMap.forEach((command: Command) => {
            if (command.hidden) return;
            if (useCustomProperties && (commandProperties as ChannelCommandData).commands[command.name]) {
                let cmdData: CommandData = (commandProperties as ChannelCommandData).commands[command.name];
                HTML += `\n <tr>
                <td>${command.name}</td>
                <td>${command.usage.replace('<', '&lt;').replace('>', '&gt;')}</td>
                <td>${cmdData?.requiredPermission?.length > 0 ? cmdData.requiredPermission : getPermissions(command.permission).join(', ')}</td>
                <td>${command.userCooldown}s</td>
                <td>${command.channelCooldown ? command.channelCooldown : 0}s</td>
                <td>${command.aliases?.length > 0 ? command.aliases.join(', ') : ''}</td>
                <td>${command.description}</td>
                <td>${command.extendedDescription ? command.extendedDescription : ''}</td>
                <td>${cmd?.disabledByDefault == true ? (cmdData?.enabled ? '✔' : '✖') : cmdData.enabled ? (cmdData.offline ? 'Offline only' : '✔') : '✖'}</td>
                </tr>
                `;
            } else {
                HTML += `\n <tr>
                <td>${command.name}</td>
                <td>${command.usage.replace('<', '&lt;').replace('>', '&gt;')}</td>
                <td>${getPermissions(command.permission).join(', ')}</td>
                <td>${command.userCooldown}s</td>
                <td>${command.channelCooldown ? command.channelCooldown : 0}s</td>
                <td>${command.aliases?.length > 0 ? command.aliases.join(', ') : ''}</td>
                <td>${command.description}</td>
                <td>${command.extendedDescription ? command.extendedDescription : ''}</td>
                <td>${command?.disabledByDefault == true ? '✖' : '✔'}</td>
                </tr>
                `;
            }
        });

        HTML += ` </table>`;

        const customCommands: ICustomCommand[] = await CustomCommand.find({ channel: channel.replace('#', '') });
        if (customCommands.length > 0) {
            HTML += `
            <h2>Custom Commands</h2>
            <table>
                <tr>
                    <th>Command</th>
                    <th>Response</th>
                    <th>User Cooldown</th>
                    <th>Channel Cooldown</th>
                </tr>
            `;
            customCommands.forEach((command: ICustomCommand) => {
                HTML += `\n <tr>
                <td>${command.command}</td>
                <td>${command.response}</td>
                <td>${command.userCooldown}s</td>
                <td>${command.channelCooldown}s</td>
                </tr>
                `;
            });
            HTML += ` </table>`;
        }

        HTML += `
    <div id="footer">Bot made by <a href="https://twitch.tv/auror6s">AuroR6S</a></div>
</html>

<style>
    table {
        border-collapse: collapse;
        width: 100%;
    }

    th,
    td {
        border: 1px solid #303436;
        padding: 5px;
    }

    a {
        color: #fff;
        text-decoration: none;
    }

    #footer {
        text-align: center;
        font-size: 14px;
        bottom: 0;
        width: 100%;
        text-align: center;
        padding: 10px;
    }

    body {
        font: 400 1em/1.5em 'Roboto', sans-serif;
        font-size: 13px;
        line-height: 1.5;
        color: #fafafa;
        background-color: #141516;
    }

    h1 {
        text-align: center;
        font: 500 2em/2em 'Roboto', sans-serif;
        color: #fafafa;
        margin-bottom: 0.5em;
    }

    h2 {
        text-align: center;
        font: 500 1.5em/1.5em 'Roboto', sans-serif;
        color: #fafafa;
        margin-bottom: 0.5em;
    }

    p {
        text-align: center;
        font: 400 1em/1em 'Roboto', sans-serif;
        color: #fafafa;
        margin-top: 1em;
    }
</style>`;

        fs.writeFileSync('./tempupload.html', HTML);
        const form = new FormData();
        form.append('attachment', fs.createReadStream('./tempupload.html'));
        let resp = await axios.post(`https://i.mrauro.dev/`, form, {
            headers: {
                ...form.getHeaders(),
                authorization: process.env.MRAURO_DEV_KEY,
            },
        });
        fs.unlinkSync('./tempupload.html');

        return {
            success: true,
            message: `View all the commands here: ${resp.data.url}`,
            error: null,
            ignorebanphrase: true,
        };
    };
}

export const cmd = new suggestCommand();
