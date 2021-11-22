import axios from 'axios';
import dotenv from 'dotenv';
import { Command, CommandReturnClass } from '../utils/commandClass';
dotenv.config();

class spamCommand extends Command {
    name = 'farmingcommits';
    description = 'View how many commits you have created in the last 24 hours';
    usage = 'spam <github username>';
    aliases = [' FarmingCommits'];
    allowCustomPermissions = true;
    userCooldown = 15;
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: 'Missing GitHub username',
                error: null,
                reducedcooldown: 2,
            };

        let githubUsernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
        if (!githubUsernameRegex.test(args[0])) return { success: false, message: 'Invalid GitHub username', error: null };

        // 24 hours ago as ISO
        const dateSince = new Date(Date.now() - 24 * 60 * 60 * 1000);

        let commitData = await axios.post(
            'https://api.github.com/graphql',
            {
                query: `{
                user(login: "${args[0]}") {
                    contributionsCollection(from: "${dateSince.toISOString()}") {
                        totalCommitContributions
                        restrictedContributionsCount
                        endedAt
                    }
                }
            }`,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                },
            }
        );

        if (commitData.data.errors)
            return {
                success: false,
                message: 'Invalid username',
                error: commitData.data.errors,
            };

        let commitCount = commitData.data.data.user.contributionsCollection.totalCommitContributions + commitData.data.data.user.contributionsCollection.restrictedContributionsCount;

        return {
            success: true,
            message: `${args[0]} has made ${commitCount} commits in the last 24 hours`,
            error: null,
        };
    };
}

export const cmd = new spamCommand();
