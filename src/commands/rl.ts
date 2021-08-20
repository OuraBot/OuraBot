import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import { isLoggedChannel } from '../utils/apis/ivr';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { error } from '../utils/logger';
dotenv.config();

class suggestCommand extends Command {
    name = 'rl';
    description = 'Get a random line from a specified user. (channel must have justlog logs enabled)';
    usage = 'rl <user?>';
    userCooldown = 5;
    channelCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let targetUser = args[0]?.replace('@', '')?.replace(',', '') || user;

        let isLogged = await isLoggedChannel(channel);
        if (isLogged.error) error(isLogged.error, ['isLoggedChannel error!!! 🚨']);
        if (!isLogged.logged) {
            return {
                success: true,
                message: `This channel is not logged on the justlog logs site (https://logs.ivr.fi)`,
                error: null,
            };
        }

        let rqResp: rqResp = await axios.get(`https://api.ivr.fi/logs/rq/${channel.replace('#', '')}/${targetUser}`);
        return {
            success: true,
            message: `[${rqResp.data.time} ago] ${rqResp.data.user}: ${rqResp.data.message}`,
            error: null,
            noping: true,
        };
    };
}

export const cmd = new suggestCommand();

class rqResp implements AxiosResponse {
    status: number;
    statusText: string;
    headers: any;
    config: AxiosRequestConfig;
    request?: any;
    data: {
        user: string;
        message: string;
        time: string;
        timestamp: string;
    };
}
