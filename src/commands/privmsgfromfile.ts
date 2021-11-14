import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import axios from 'axios';
import dotenv from 'dotenv';
import { chatClient, commands, FILE_URLS_REGEX, redis } from '..';
import { Term } from '../models/term.model';
import { logCommandUse } from '../models/usage.model';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { addTask, removeTask } from '../utils/taskManager';
dotenv.config();

class testComand extends Command {
    name = 'privmsgfromfile';
    description = 'privmsgfromfile';
    extendedDescription = 'Runs a list of messages';
    usage = 'privmsgfromfile <file url>';
    permission = 1;
    hidden = true;
    execute = async (user: string, channel: string, args: string[], _: string, _msg: TwitchPrivateMessage): Promise<CommandReturnClass> => {
        if (!args[0].match(FILE_URLS_REGEX))
            return {
                success: false,
                message: 'Missing RAW haste/pastebin/gist link',
                error: null,
            };

        let msgs = (await axios.get(args[0])).data.split('\n');

        const silent = args.includes('--silent');

        addTask(channel, this.name);

        for (let msg of msgs) {
            let args = msg.split(' ');
            let targetCmd = args[0];
            args.shift();

            let _cmds = commands;
            if ((await _cmds).get(targetCmd)) {
                let cmd = (await _cmds).get(targetCmd);
                cmd.execute(user, channel, args, cmd, _msg).then((data: CommandReturnClass) => {
                    if (!silent) {
                        if (data.success) {
                            if (data.message) {
                                if (Array.isArray(data.message)) {
                                    for (let m of data.message) {
                                        if (process.env?.DEBUG !== 'TRUE') logCommandUse(user, channel, cmd.name, data.success, args, `${data.noping ? '' : `@${user}, `}`);
                                        chatClient.say(channel, `${data.noping ? '' : `@${user}, `}${m}`);
                                    }
                                } else {
                                    if (process.env?.DEBUG !== 'TRUE') logCommandUse(user, channel, cmd.name, data.success, args, `${data.noping ? '' : `@${user}, `}${data.message}`);
                                    chatClient.say(channel, `${data.noping ? '' : `@${user}, `}${data.message}`);
                                }
                            }
                        } else {
                            if (process.env?.DEBUG !== 'TRUE')
                                logCommandUse(user, channel, cmd.name, data.success, args, `@${user}, command unsucessful: ${data?.message ? data.message : data.error}`);
                            chatClient.say(channel, `@${user}, command unsucessful: ${data?.message ? data.message : data.error}`);
                        }
                    }
                });
            } else {
                chatClient.say(channel, `Unrecognizd command`);
            }
        }
        removeTask(channel, this.name);

        return {
            success: true,
            message: null,
            error: null,
        };
    };
}

export const cmd = new testComand();
