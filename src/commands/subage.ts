import dotenv from 'dotenv';
import { apiClient, chatClient, redis } from '..';
import { createNewSuggestion } from '../models/suggestion.model';
import { Command, CommandReturnClass, ErrorEnum } from '../utils/commandClass';
import { getChannels } from '../utils/fetchChannels';
import { prettyTime } from '../utils/auroMs';
import { obfuscateName } from '../utils/stringManipulation';
import { resolveUser, subageLookup } from '../utils/apis/ivr';
import moment from 'moment';
dotenv.config();

class suggestCommand extends Command {
    name = 'subage';
    description = 'Check how long someone has been subscribed to a channel';
    usage = 'subage <user> <channel>';
    userCooldown = 3;
    channelCooldown = 1;
    aliases = ['sa', 'subbage'];
    execute = async (user: string, channel: string, args: string[]): Promise<CommandReturnClass> => {
        if (!args[0])
            return {
                success: false,
                message: null,
                error: ErrorEnum.MISSING_USER,
            };

        let targetUser = args[0].replace('@', '').replace(',', '').replace('#', '');

        if (!args[1])
            return {
                success: false,
                message: null,
                error: ErrorEnum.MISSING_CHANNEL,
            };

        let targetChannel = args[1].replace('@', '').replace(',', '').replace('#', '');

        let userResp = await subageLookup(targetUser, targetChannel);
        if (!userResp.success)
            return {
                success: false,
                message: 'User or channel not found',
                error: null,
            };

        const resp = userResp;

        if (resp.data.subscribed) {
            let tier = resp.data.meta.tier;
            let dnr = resp.data.meta.dnr;
            let endsAt = prettyTime(moment(resp.data.meta?.endsAt).unix() * 1000 - Date.now());
            let renewsAt = prettyTime(moment(resp.data.meta?.renewsAt).unix() * 1000 - Date.now());
            let gift = resp.data.meta?.gift;

            let saReturn: string;

            let streak = resp.data.streak?.months ? ` with a streak of ${resp.data.streak.months} months` : '';

            if (resp.data.hidden) {
                if (resp.data.meta.type === 'paid') {
                    if (dnr) {
                        // prettier-ignore
                        saReturn = `${obfuscateName(resp.data.username)} has their subscription to ${obfuscateName(resp.data.channel)} hidden with a Tier ${tier} sub ${streak} and ends in ${endsAt}`;
                    } else {
                        // prettier-ignore
                        saReturn = `${obfuscateName(resp.data.username)} has their subscription to ${obfuscateName(resp.data.channel)} hidden with a Tier with a Tier ${tier} sub ${streak} and renews in ${renewsAt}`;
                    }
                } else if (resp.data.meta.type === 'gift') {
                    // prettier-ignore
                    saReturn = `${obfuscateName(resp.data.username)} has their subscription to ${obfuscateName(resp.data.channel)} hidden with a gifted subscription by ${gift.name} and ends in ${endsAt}`;
                } else if (resp.data.meta.type === 'prime') {
                    // prettier-ignore
                    saReturn = `${obfuscateName(resp.data.username)} has their subscription to ${obfuscateName(resp.data.channel)} hidden with a Prime subscription and ends in ${endsAt}`;
                }
            } else {
                if (resp.data.meta.type === 'paid') {
                    if (dnr) {
                        // prettier-ignore
                        saReturn = `${obfuscateName(resp.data.username)} has been subscribed to ${obfuscateName(resp.data.channel)} for ${resp.data.cumulative.months} month(s) with a Tier ${tier} sub ${streak} and ends in ${endsAt}`;
                    } else {
                        // prettier-ignore
                        saReturn = `${obfuscateName(resp.data.username)} has been subscribed to ${obfuscateName(resp.data.channel)} for ${resp.data.cumulative.months} month(s) with a Tier ${tier} sub ${streak}${renewsAt ? ` and renews in ${renewsAt}` : '. This is a permanent sub!'}`;
                    }
                } else if (resp.data.meta.type === 'gift') {
                    // prettier-ignore
                    saReturn = `${obfuscateName(resp.data.username)} has been subscribed to ${obfuscateName(resp.data.channel)} with a gifted subscription by ${gift.name} for ${resp.data.cumulative.months} month(s) with a Tier ${tier} sub ${streak} and ends in ${endsAt}`;
                } else if (resp.data.meta.type === 'prime') {
                    // prettier-ignore
                    saReturn = `${obfuscateName(resp.data.username)} has been subscribed to ${obfuscateName(resp.data.channel)} with a Prime subscription for ${resp.data.cumulative.months} month(s) ${streak} and ends in ${endsAt}`;
                }
            }

            return {
                success: true,
                message: saReturn,
                error: null,
            };
        } else {
            let endedAt = prettyTime(Date.now() - moment(resp.data.cumulative?.end).unix() * 1000);

            if (resp.data.cumulative.months > 0) {
                // prettier-ignore
                return {
                    success: true,
                    message: `${obfuscateName(resp.data.username)} has previously been subscribed to ${obfuscateName(resp.data.channel)} for ${resp.data.cumulative.months} months, however it ended ${endedAt} ago`,
                    error: null,
                }
            } else {
                return {
                    success: true,
                    message: `${obfuscateName(resp.data.username)} has never been subscribed to ${obfuscateName(resp.data.channel)}`,
                    error: null,
                };
            }
        }
    };
}

export const cmd = new suggestCommand();
