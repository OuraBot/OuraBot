require('dotenv').config();
import axios from 'axios';
import chalk from 'chalk';
import { MessageEmbed } from 'discord.js';
import os from 'os';
import { discordManager, redis } from '..';
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

            // check if error is mongo timeout error
            if (error.message.includes('MongooseServerSelectionError: connection timed out')) {
                // implement a 5s rate limit to prevent spamming the discord channel
                const rateLimit = await redis.get('mongoose_timeout_rate_limit');
                if (rateLimit) {
                    return;
                }
                await redis.set('mongoose_timeout_rate_limit', '1', 'EX', 5);
                const embed = new MessageEmbed()
                    .setTitle('Mongoose Timeout Error')
                    .setColor(LogColors[logLevel])
                    .setTimestamp()
                    .setDescription(`${error.stack}\n\n${args.join('\n')}`);

                discordManager.postError(embed);
                return;
            }

            // check if error is 429 rate limit error
            if (error.message.includes('429')) {
                // implement a 5s rate limit to prevent spamming the discord channel
                const rateLimit = await redis.get('rate_limit_rate_limit');
                if (rateLimit) {
                    return;
                }
                await redis.set('rate_limit_rate_limit', '1', 'EX', 10);

                const embed = new MessageEmbed()
                    .setTitle('Rate Limit Error')
                    .setColor(LogColors[logLevel])
                    .setTimestamp()
                    .setDescription(`${error.stack}\n\n${args.join('\n')}`);

                discordManager.postError(embed);
                return;
            }

            // check if error is duplicate key error
            if (error.message.includes('E11000 duplicate key error')) {
                // implement a 30s rate limit to prevent spamming the discord channel
                const rateLimit = await redis.get('duplicate_key_rate_limit');
                if (rateLimit) {
                    return;
                }
                await redis.set('duplicate_key_rate_limit', '1', 'EX', 30);

                const embed = new MessageEmbed()
                    .setTitle('Duplicate Key Error')
                    .setColor(LogColors[logLevel])
                    .setTimestamp()
                    .setDescription(`${error.stack}\n\n${args.join('\n')}`);

                discordManager.postError(embed);
                return;
            }

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

            const embed = new MessageEmbed()
                .setTitle('Error:' + ' ' + error.message)
                .setColor(LogColors[logLevel])
                .setTimestamp()
                .setDescription(`${error.stack}\n\n${args.join('\n')}`);

            discordManager.postError(embed);

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
