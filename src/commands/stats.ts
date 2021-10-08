import dotenv from 'dotenv';
import { commands, redis } from '../index';
import { IUsage, Usage } from '../models/usage';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';

dotenv.config();

class testComand extends Command {
    name = 'stats';
    description = 'Gets the stats of a command, user, channel, or globally';
    usage = 'stats (command|@user|#channel|<leave empty for global stats>) ';
    channelCooldown = 10;
    userCooldown = 10;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0]) {
            let commandsExecuted: number, successCount: number, mostCommonCommand: string, mostCommonCommandCount: number;
            const usages = await Usage.find({});
            if (usages.length === 0)
                return {
                    success: false,
                    message: `No commands have been used`,
                    error: null,
                };

            commandsExecuted = usages.length;
            mostCommonCommand = getMostCommonCommand(usages);
            mostCommonCommandCount = usages.filter((usage: IUsage) => usage.command === mostCommonCommand).length;

            successCount = usages.filter((usage: IUsage) => usage.success).length;

            return {
                success: true,
                message: `${commandsExecuted} commands have been used. The most used command is ${mostCommonCommand} at ${mostCommonCommandCount} uses. ${Math.round(
                    (successCount / commandsExecuted) * 100
                )}% of the commands have been successful.`,
                error: null,
            };
        } else if (args[0].startsWith('@')) {
            let commandsExecuted: number, mostCommonCommand: string, mostCommonCommandCount: number, successCount: number;
            const usages = await Usage.find({ user: args[0].slice(1).toLowerCase() });
            if (usages.length === 0)
                return {
                    success: false,
                    message: `${args[0]} has not used any commands`,
                    error: null,
                };

            commandsExecuted = usages.length;
            mostCommonCommand = getMostCommonCommand(usages);
            mostCommonCommandCount = usages.filter((usage: IUsage) => usage.command === mostCommonCommand).length;

            successCount = usages.filter((usage: IUsage) => usage.success).length;

            return {
                success: true,
                message: `${args[0].slice(1).toLowerCase() === user ? 'You have' : `User ${obfuscateName(args[0]).slice(1).toLowerCase()} has`} used ${commandsExecuted} commands. ${
                    args[0].slice(1).toLowerCase() === user ? 'Your' : 'Their'
                } most used command is ${mostCommonCommand} at ${mostCommonCommandCount} uses. ${Math.round((successCount / commandsExecuted) * 100)}% of ${
                    args[0].slice(1).toLowerCase() === user ? 'your' : 'their'
                } commands have been successful.`,
                error: null,
            };
        } else if (args[0].startsWith('#')) {
            let commandsExecuted: number, mostCommonCommand: string, mostCommonCommandCount: number, successCount: number;
            const usages = await Usage.find({ channel: args[0].toLowerCase() });
            if (usages.length === 0)
                return {
                    success: false,
                    message: `Channel ${args[0]} has not used any commands`,
                    error: null,
                };

            commandsExecuted = usages.length;
            mostCommonCommand = getMostCommonCommand(usages);
            mostCommonCommandCount = usages.filter((usage: IUsage) => usage.command === mostCommonCommand).length;

            successCount = usages.filter((usage: IUsage) => usage.success).length;

            return {
                success: true,
                message: `Channel ${obfuscateName(
                    args[0]
                ).toLowerCase()} has used ${commandsExecuted} commands. The most used command there is ${mostCommonCommand} at ${mostCommonCommandCount} uses. ${Math.round(
                    (successCount / commandsExecuted) * 100
                )}% of the commands executed there have been successful.`,
                error: null,
            };
        } else if ((await commands).has(args[0])) {
            let commandsExecuted: number, successCount: number, mostCommonUser: string, mostCommonUserCount: number;
            const usages = await Usage.find({ command: args[0] });
            if (usages.length === 0)
                return {
                    success: false,
                    message: `Command ${args[0]} has not been used`,
                    error: null,
                };

            commandsExecuted = usages.length;
            mostCommonUser = getMostCommonUser(usages);
            mostCommonUserCount = usages.filter((usage: IUsage) => usage.user === mostCommonUser).length;

            successCount = usages.filter((usage: IUsage) => usage.success).length;

            return {
                success: true,
                message: `Command ${args[0]} has been used ${commandsExecuted} times. The most used user of this command is @${obfuscateName(
                    mostCommonUser
                )} at ${mostCommonUserCount} uses. ${Math.round((successCount / commandsExecuted) * 100)}% of the executions of this command have been successful.`,
                error: null,
            };
        } else {
            return {
                success: false,
                message: `Command ${args[0]} does not exist`,
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
