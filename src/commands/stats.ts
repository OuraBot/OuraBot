import dotenv from 'dotenv';
import { Channel } from '../models/channel.model';
import { IUsage, Usage } from '../models/usage.model';
import { Command, CommandReturnClass } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'stats';
    description = 'Get stats about the bot, including the most used command';
    usage = 'stats';
    userCooldown = 10;
    channelCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0]) {
            const usages = await Usage.aggregate([
                {
                    $group: {
                        _id: {
                            command: '$command',
                        },
                        count: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $sort: {
                        '_id.command': 1,
                        count: -1,
                    },
                },
                {
                    $group: {
                        _id: {
                            command: '$_id.command',
                        },
                        count: {
                            $first: '$count',
                        },
                    },
                },
            ]);

            let uniqueUserCount = (await Usage.distinct('user')).length;

            let mostUsedCommand = usages.sort((a, b) => b.count - a.count)[0];
            let totalCount = usages.reduce((a, b) => a + b.count, 0);
            let channelCount = await Channel.countDocuments({});

            return {
                success: true,
                message: `I am currently in ${channelCount} channels. ${totalCount} commands have been used. The most used command is ${mostUsedCommand._id.command} at ${mostUsedCommand.count} uses. There are ${uniqueUserCount} unique users.`,
                error: null,
            };
        } else {
            return {
                success: true,
                message: 'The ability to view the stats for a specific command/user/channel has been removed (since Nov 18 2021)',
                error: null,
            };
        }
    };
}

function getMostCommonCommand(usages: IUsage[]): string {
    let commands: string[] = [];
    usages.forEach((usage: IUsage) => {
        commands.push(usage.command);
    });
    return getMostCommon(commands);
}

function getMostCommonUser(usages: IUsage[]): string {
    let users: string[] = [];
    usages.forEach((usage: IUsage) => {
        users.push(usage.user);
    });
    return getMostCommon(users);
}

// Get the most common element of a string array
function getMostCommon(arr: string[]): string {
    return arr.reduce((a, b) => (arr.filter((v) => v === a).length > arr.filter((v) => v === b).length ? a : b));
}

export const cmd = new testComand();
