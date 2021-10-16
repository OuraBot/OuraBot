import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import dotenv from 'dotenv';
import { SQLParser } from 'sql-in-mongodb';
import { chatClient } from '..';
/*
    tables:
    afk
    channel
    clip
    command
    error
    module
    reminder
    sub
    suggestion
    term
    usage
*/
import { Afk } from '../models/afk.model';
import { Channel } from '../models/channel.model';
import { Clip } from '../models/clip.model';
import { CustomCommand } from '../models/command.model';
import { ErrorModel } from '../models/error.model';
import { Module } from '../models/module.model';
import { Reminder } from '../models/reminder.model';
import { Sub } from '../models/sub.model';
import { SuggestionModel } from '../models/suggestion.model';
import { Term } from '../models/term.model';
import { Usage } from '../models/usage.model';
import { upload } from '../utils/apis/haste';
import { Command, CommandReturnClass } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'ssql';
    description = 'Make a simple SQL query';
    usage = 'ssql <query>';
    permission = 1;
    hidden = true;
    execute = async (user: string, channel: string, args: string[], cmdMsg: string, msg: TwitchPrivateMessage): Promise<CommandReturnClass> => {
        try {
            let sqlQuery = args.join(' ');
            const table = sqlQuery.match(/FROM\s+(\w+)/)?.[1];

            const parser = new SQLParser();

            switch (table) {
                case 'afks':
                    {
                        let data = await Afk.find(parser.parseSql(sqlQuery));
                        const url = await upload(data.toString());
                        chatClient.whisper(user, `${url}`);

                        return {
                            success: true,
                            message: null,
                            error: null,
                        };
                    }
                    break;
                case 'channels':
                    {
                        let data = await Channel.find(parser.parseSql(sqlQuery));
                        const url = await upload(data.toString());
                        chatClient.whisper(user, `${url}`);

                        return {
                            success: true,
                            message: null,
                            error: null,
                        };
                    }
                    break;
                case 'clips':
                    {
                        let data = await Clip.find(parser.parseSql(sqlQuery));
                        const url = await upload(data.toString());
                        chatClient.whisper(user, `${url}`);

                        return {
                            success: true,
                            message: null,
                            error: null,
                        };
                    }
                    break;
                case 'commands':
                    {
                        let data = await CustomCommand.find(parser.parseSql(sqlQuery));
                        const url = await upload(data.toString());
                        chatClient.whisper(user, `${url}`);

                        return {
                            success: true,
                            message: null,
                            error: null,
                        };
                    }
                    break;
                case 'errors':
                    {
                        let data = await ErrorModel.find(parser.parseSql(sqlQuery));
                        const url = await upload(data.toString());
                        chatClient.whisper(user, `${url}`);

                        return {
                            success: true,
                            message: null,
                            error: null,
                        };
                    }
                    break;
                case 'modules':
                    {
                        let data = await Module.find(parser.parseSql(sqlQuery));
                        const url = await upload(data.toString());
                        chatClient.whisper(user, `${url}`);

                        return {
                            success: true,
                            message: null,
                            error: null,
                        };
                    }
                    break;
                case 'reminders':
                    {
                        let data = await Reminder.find(parser.parseSql(sqlQuery));
                        const url = await upload(data.toString());
                        chatClient.whisper(user, `${url}`);

                        return {
                            success: true,
                            message: null,
                            error: null,
                        };
                    }
                    break;
                case 'subs':
                    {
                        let data = await Sub.find(parser.parseSql(sqlQuery));
                        const url = await upload(data.toString());
                        chatClient.whisper(user, `${url}`);

                        return {
                            success: true,
                            message: null,
                            error: null,
                        };
                    }
                    break;

                case 'suggestions':
                    {
                        let data = await SuggestionModel.find(parser.parseSql(sqlQuery));
                        const url = await upload(data.toString());
                        chatClient.whisper(user, `${url}`);

                        return {
                            success: true,
                            message: null,
                            error: null,
                        };
                    }
                    break;
                case 'terms':
                    {
                        let data = await Term.find(parser.parseSql(sqlQuery));
                        const url = await upload(data.toString());
                        chatClient.whisper(user, `${url}`);

                        return {
                            success: true,
                            message: null,
                            error: null,
                        };
                    }
                    break;
                case 'usages':
                    {
                        let data = await Usage.find(parser.parseSql(sqlQuery));
                        const url = await upload(data.toString());
                        chatClient.whisper(user, `${url}`);

                        return {
                            success: true,
                            message: null,
                            error: null,
                        };
                    }
                    break;
                default:
                    return {
                        success: false,
                        message: 'Invalid table name',
                        error: null,
                    };
            }
        } catch (error) {
            const url = await upload(error.toString());
            chatClient.whisper(user, `Error: ${url}`);
            return {
                success: true,
                message: null,
                error: null,
            };
        }
    };
}

export const cmd = new testComand();
