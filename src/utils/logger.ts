require('dotenv').config();
import axios from 'axios';
import chalk from 'chalk';
import os from 'os';
import { redis } from '..';
import { ErrorModel } from '../models/error.model';

export enum ILogLevel {
    WARN = 'WARN',
    ERROR = 'ERROR',
}

enum LogColors {
    WARN = '#ffff00',
    ERROR = '#ff0000',
}

export class Logger {
    logLevel: ILogLevel;
    discordWebhook: string;

    constructor(logLevel: ILogLevel) {
        this.logLevel = logLevel;
        this.discordWebhook = process.env.DISCORD_WEBHOOK;
    }

    async log(logLevel: ILogLevel, error: Error, ...args: any[]) {
        if (this.logLevel >= logLevel) {
            console.log(chalk.hex(LogColors[logLevel])(`[${logLevel}]`), ...args);

            let counterData = Number(await redis.get(`ob:counter`));
            if (!counterData) {
                await redis.set(`ob:counter`, 1);
                counterData = 1;
            } else {
                await redis.incr(`ob:counter`);
            }

            const newError = new ErrorModel({
                args: args.join('\n'),
                error: error.stack,
                id: counterData,
            });

            newError.save();

            axios.post(this.discordWebhook, {
                embeds: [
                    {
                        title: `OuraBot :: Error - Error ID #${counterData}`,
                        description: error.stack + '\n\n' + args.join('\n'),
                        color: 16711680,
                        author: {
                            name: `OuraBot - ${os.hostname}`,
                        },
                        timestamp: new Date(),
                    },
                ],
            });

            return counterData;
        }
    }

    async error(error: Error, ...args: any[]) {
        return await this.log(ILogLevel.ERROR, error, args);
    }

    async warn(error: Error, ...args: any[]) {
        return await this.log(ILogLevel.WARN, error, args);
    }
}

export async function createNewError(channel: string, user: string, message: string, command: string, _error: string): Promise<Number> {
    let counterData = Number(await redis.get(`ob:counter`));
    if (!counterData) {
        await redis.set(`ob:counter`, 1);
        counterData = 1;
    } else {
        await redis.incr(`ob:counter`);
    }

    const newError = new ErrorModel({
        channel: channel,
        user: user,
        bot: `${process.env.CLIENT_cUSERNAME}`,
        message: message,
        command: command,
        error: _error,
        completed: false,
        id: counterData,
    });

    newError.save();

    return counterData;
}

/*
            console.log(chalk.hex(LogColors[logLevel])(`[${logLevel}]`), ...args);
            
if (logLevel === ILogLevel.ERROR) {
            // embed
            axios.post(this.discordWebhook, {
                embeds: [
                    {
                        title: `OuraBot :: Error`,
                        description: args.join('\n'),
                        color: 16711680,
                        author: {
                            name: `OuraBot - ${os.hostname}`,
                        },
                        timestamp: new Date(),
                    },
                ],
            });
        }
*/
