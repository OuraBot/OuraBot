import dotenv from 'dotenv';
import prettyMilliseconds from 'pretty-ms';
import { branch, commitAuthor, commitCount, commitDate, commitHash, commitMessage } from '..';
import { Command, CommandReturnClass } from '../utils/commandClass';
import { obfuscateName } from '../utils/stringManipulation';
dotenv.config();

class suggestCommand extends Command {
    name = 'git';
    description = "View information about the bot's latest commit";
    usage = 'git';
    aliases = ['github', 'commit'];
    userCooldown = 5;
    channelCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        let dateSinceCommit = prettyMilliseconds(new Date().getTime() - new Date(commitDate).getTime(), {
            secondsDecimalDigits: 0,
        });
        return {
            success: true,
            message: `MrDestructoid ${commitCount} commits. ${branch}@${commitHash.substr(0, 7)} by ${obfuscateName(commitAuthor)} (${dateSinceCommit} ago): ${commitMessage
                .split('\n')
                .filter((n) => n)
                .join(' - ')}`,
            error: null,
        };
    };
}

export const cmd = new suggestCommand();
