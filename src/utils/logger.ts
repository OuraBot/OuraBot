import * as winston from 'winston';
import 'winston-daily-rotate-file';
import DiscordTransport from 'winston-discord-transport';

import dotenv from 'dotenv';
import { addColors } from 'winston/lib/winston/config';
dotenv.config();

const loggerlevels = {
    colors: {
        info: 'green',
        error: 'underline bold red',
        debug: 'bold magenta',
        warn: 'yellow',
    },
};

const options = {
    filename: `${process.env.CLIENT_USERNAME}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20M',
    dirname: `${process.env.CLIENT_USERNAME}-logs/`,
};

const dailyTransport = new winston.transports.DailyRotateFile(options);

const logger = winston.createLogger({
    level: process.env.DEBUG ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'DD-MM-YY HH:mm:ss.SSS',
        }),
        winston.format.colorize(),
        winston.format.printf((info) => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`)
    ),
    transports: [
        new DiscordTransport({
            webhook: process.env.DISCORD_WEBHOOK,
            defaultMeta: { service: process.env.CLIENT_USERNAME },
            level: 'error',
        }),
        new winston.transports.Console(),
        new winston.transports.File({ filename: `${process.env.CLIENT_USERNAME}-errors.log`, level: 'error' }),
        new winston.transports.File({ filename: `${process.env.CLIENT_USERNAME}-info.log`, level: 'info' }),
        dailyTransport,
    ],
});

addColors(loggerlevels.colors);

export function info(message: string, args?: string[]): void {
    if (args?.length > 0) {
        logger.info(`INFO - ${process.env.CLIENT_USERNAME}: ${message} | ${args?.join(' - ')}`);
    } else {
        logger.info(`INFO - ${process.env.CLIENT_USERNAME}: ${message}`);
    }
}

export function error(message: string, args?: string[]): void {
    if (args?.length > 0) {
        logger.error(`ERROR - ${process.env.CLIENT_USERNAME}: ${message} | ${args?.join(' - ')}`);
    } else {
        logger.error(`ERROR - ${process.env.CLIENT_USERNAME}: ${message}`);
    }
}

export function debug(message: string, args?: string[]): void {
    if (args?.length > 0) {
        logger.debug(`DEBUG - ${process.env.CLIENT_USERNAME}: ${message} | ${args?.join(' - ')}`);
    } else {
        logger.debug(`DEBUG - ${process.env.CLIENT_USERNAME}: ${message}`);
    }
}

export function warn(message: string, args?: string[]): void {
    if (args?.length > 0) {
        logger.warn(`WARN - ${process.env.CLIENT_USERNAME}: ${message} | ${args?.join(' - ')}`);
    } else {
        logger.warn(`WARN - ${process.env.CLIENT_USERNAME}: ${message}`);
    }
}
