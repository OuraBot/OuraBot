import dotenv from 'dotenv';
import prettyMilliseconds from 'pretty-ms';
import { resolveUser } from '../utils/apis/ivr';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'whois';
    description = 'Get information about a user';
    usage = 'whois <username?>';
    userCooldown = 5;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let targetUser = args[0] || user;

        let userResp;
        try {
            userResp = await resolveUser(targetUser);
        } catch (err) {
            return {
                success: false,
                message: 'User not found',
                error: null,
            };
        }

        if (!userResp.success)
            return {
                success: false,
                message: 'User not found',
                error: null,
            };

        let rolesArr = [];
        if (userResp.user.roles.isAffiliate) {
            rolesArr.push('affiliate');
        }
        if (userResp.user.roles.isPartner) {
            rolesArr.push('partner');
        }
        if (userResp.user.roles.isSiteAdmin) {
            rolesArr.push('admin');
        }
        if (userResp.user.roles.isStaff) {
            rolesArr.push('staff');
        }
        if (userResp.user.bot) {
            rolesArr.push('bot');
        }
        let finalStr = `user: ${obfuscateName(targetUser)}, ${userResp.user.banned ? '⛔ BANNED | ' : ''} chat color: ${
            userResp.user.chatColor ? userResp.user.chatColor : 'gray name'
        } | account created ${prettyMilliseconds(Date.now() - new Date(userResp.user.createdAt).getTime(), {
            secondsDecimalDigits: 0,
        })} ago | roles: ${rolesArr.length == 0 ? 'None' : rolesArr.join(' ')} | id: ${userResp.user.id}`;

        let tempStr = finalStr + ` | bio: ${userResp.user.bio}`;
        if (tempStr.length >= 499) {
            return {
                success: true,
                message: finalStr,
                error: null,
            };
        } else {
            return {
                success: true,
                message: tempStr,
                error: null,
            };
        }
    };
}

export const cmd = new suggestCommand();
