import { promises as fs } from 'fs-extra';
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { config } from '..';

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
    Admin = 32,
    Ambassador = 64,
    AmbassadorVIP = 128,
    AmbassadorMod = 256,
    AmbassadorBroadcaster = 512,
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
    execute: (user: string, channel: string, args: string[], cmdMsg?: string, msg?: TwitchPrivateMessage) => Promise<any> | undefined;
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

export function getPermissions(int: number): string[] {
    let permissions: string[] = [];
    for (let permission in PermissionEnum) {
        // we have to do this mess because of typescript
        if ((int & (PermissionEnum as any)[permission]) === (PermissionEnum as any)[permission]) {
            permissions.push(permission);
        }
    }
    return permissions;
}

export function hasPermisison(requiredPermission: PermissionEnum, user: string, channel: string, msg: any): boolean {
    let permissionInt: number = 0;
    if (user === config.owner) permissionInt += PermissionEnum.Developer;
    if (config.admins.includes(user)) permissionInt += PermissionEnum.Admin;
    if (msg.userInfo.isBroadcaster) permissionInt += PermissionEnum.Broadcaster;
    if (msg.userInfo.isMod) permissionInt += PermissionEnum.Moderator;
    if (msg.userInfo.isVip) permissionInt += PermissionEnum.VIP;
    if (msg.userInfo.isSubscriber) permissionInt += PermissionEnum.Subscriber;
    if (config.ambassadors.includes(user)) permissionInt += PermissionEnum.Ambassador;
    if (config.ambassadors.includes(user) && msg.userInfo.isVip) permissionInt += PermissionEnum.AmbassadorVIP;
    if (config.ambassadors.includes(user) && msg.userInfo.isMod) permissionInt += PermissionEnum.AmbassadorMod;
    if (config.ambassadors.includes(user) && msg.userInfo.isBroadcaster) permissionInt += PermissionEnum.AmbassadorBroadcaster;

    const userPermissions = getPermissions(permissionInt);
    const commandPermissions = getPermissions(requiredPermission);

    // console.log(permissionInt, user);
    // console.log(userPermissions, commandPermissions);

    return userPermissions.some((p) => commandPermissions.includes(p));
}
