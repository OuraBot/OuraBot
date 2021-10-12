import dotenv from 'dotenv';
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { config } from '..';
import { Command, CommandReturnClass, getPermissions, PermissionEnum } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'permissions';
    description = 'Get your user permissions';
    usage = 'permissions';
    userCooldown = 5;
    hidden = true;
    execute = async (user: string, channel: string, args: string[], cmdMsg: string, msg: TwitchPrivateMessage): Promise<CommandReturnClass> => {
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

        const permissions = getPermissions(permissionInt);

        return {
            success: true,
            message: `Int: ${permissionInt} | ${permissions.join(', ')}`,
            error: null,
        };
    };
}

export const cmd = new testComand();
