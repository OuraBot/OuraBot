import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import ob from '..';
import { Command, Events } from '../Typings/Twitch';

export const event: Events = {
	name: 'messageRateLimit',
	run: (client, channel: string) => {
		ob.logger.info(`Message rate limited in ${channel}`, 'ob.twitch.events.messageRateLimit');
		ob.prometheus.messagesRateLimited.labels({ channel: channel }).inc();
	},
};
