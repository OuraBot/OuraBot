import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { upload } from '../utils/apis/haste';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

interface Commit {
    hash: string;
    message: string;
    date: string;
    author: string;
}

class changelogCommand extends Command {
    name = 'changelog';
    description = 'View the latests commits for the past 7 days';
    usage = 'changelog';
    hidden = true;
    userCooldown = 10;
    channelCooldown = 5;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        // get all the commits from the last 7 days
        const hashes = execSync(`git log --pretty=format:"%h" --since="7 days ago"`).toString();
        const messages = execSync(`git log --pretty=format:"%s" --since="7 days ago"`).toString();
        const dates = execSync(`git log --pretty=format:"%ar" --since="7 days ago"`).toString();
        const authors = execSync(`git log --pretty=format:"%an" --since="7 days ago"`).toString();

        // parse the commits
        const commits: Commit[] = [];
        for (let i = 0; i < hashes.split('\n').length; i++) {
            const hash = hashes.split('\n')[i];
            const message = messages.split('\n')[i];
            const date = dates.split('\n')[i];
            const author = authors.split('\n')[i];

            // skip empty commits

            if (message.startsWith('[HIDDEN]')) continue;

            commits.push({
                hash,
                message,
                date,
                author,
            });
        }

        /*
            EXAMPLE ENTRY:

            2 days ago by Auro:
                Added a new feature
        */

        let data = `Changelog for the past 7 days:\n\n`;
        for (const commit of commits) {
            data += `${commit.date} by ${commit.author}:\n    ${commit.message} [${commit.hash}]\n\n`;
        }

        data += `\n\nBot made by @AuroR6S`;

        const haste = await upload(data);

        console.log(commits);
        return {
            success: true,
            message: `Commits for the past 7 days: ${haste}`,
            error: null,
        };
    };
}

export const cmd = new changelogCommand();
