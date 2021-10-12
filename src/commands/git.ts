import dotenv from 'dotenv';
import { branch, commitAuthor, commitDate, commitHash, commitMessage } from '..';
import { prettyTime } from '../utils/auroMs';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'git';
    description = "View information about the bot's latest commit";
    usage = 'git';
    aliases = ['github', 'commit'];
    userCooldown = 1;
    channelCooldown = 1;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let dateSinceCommit = prettyTime(new Date().getTime() - new Date(commitDate).getTime(), false);
        return {
            success: true,
            message: `MrDestructoid ${branch}@${commitHash.substr(0, 7)} by ${obfuscateName(commitAuthor)} (${dateSinceCommit} ago): ${commitMessage
                .split('\n')
                .filter((n) => n)
                .join(' - ')}`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
