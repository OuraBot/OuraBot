import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import dotenv from 'dotenv';
import { config } from '..';
import { Command, CommandReturnClass, getPermissions, PermissionEnum } from '../utils/commandClass';

dotenv.config();

class testComand extends Command {
    name = 'permissions';
    description = 'Get your user permissions';
    usage = 'permissions';
    userCooldown = 5;
    channelCooldown = 1;
    hidden = true;
    execute = async (user: string, channel: string, args: string[], cmdMsg: string, msg: TwitchPrivateMessage): Promise<CommandReturnClass> => {
        if (!args[0]) {
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
        } else {
            let permissionInt: number = parseInt(args[0]);
            if (isNaN(permissionInt))
                return {
                    success: false,
                    message: 'Invalid permission number',
                    error: null,
                };

            const permissions = getPermissions(permissionInt);

            return {
                success: true,
                message: `Int: ${permissionInt} | ${permissions.join(', ')}`,
                error: null,
            };
        }
    };
}

export const cmd = new testComand();
