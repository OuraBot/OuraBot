import { promises as fs } from 'fs-extra';

export enum ErrorEnum {
    MISSING_ARGS = 'Missing arguments',
    INVALID_ARGS = 'Invalid arguments',

    MISSING_USER = 'Missing user',
    INVALID_USER = 'Invalid user',

    MISSING_CHANNEL = 'Missing channel',
    INVALID_CHANNEL = 'Invalid channel',

    UNKNOWN_ERROR = 'Unknown error',
}

export class CommandReturnClass {
    success: boolean;
    message: string | string[] | null;
    error: ErrorEnum | null;
    noping?: boolean | null;
    ignorebanphrase?: boolean | null;
    reducedcooldown?: number | null;
}

export enum PermissionEnum {
    Developer = 1,
    Broadcaster = 2,
    Moderator = 4,
    VIP = 8,
    Subscriber = 16,
}

export class Command {
    name: string | undefined;
    description: string | undefined;
    extendedDescription?: string | undefined;
    usage: string | undefined;
    userCooldown?: number | undefined; /* in seconds */
    channelCooldown?: number | undefined; /* in seconds */
    permission?: PermissionEnum | undefined;
    hidden?: boolean | undefined;
    aliases?: string[] | undefined;
    execute: (user: string, channel: string, args: string[], cmdMsg?: string) => Promise<any> | undefined;
}

export async function getCommands(): Promise<Map<string, any>> {
    return new Map(
        (await fs.readdir('src/commands'))
            .map((file) => file.replace(/\.ts$/, ''))
            .map((command: string): [string, Command] => {
                delete require.cache[require.resolve(`../commands/${command}`)];
                const cmd = require(`../commands/${command}`);
                return [cmd.cmd.name, cmd.cmd];
            })
    );
}
