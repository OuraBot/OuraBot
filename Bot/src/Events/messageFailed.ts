import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import ob from '..';
import { Command, Events } from '../Typings/Twitch';

export const event: Events = {
	name: 'messageFailed',
	run: (client, channel: string, reason: string) => {
		ob.logger.info(`Message failed to send in #${channel}: ${reason}`, 'ob.twitch.events.messageFailed');
		ob.prometheus.messagesFailed.labels({ channel: channel, reason: reason }).inc();

		if (reason === 'msg_rejected_mandatory') {
			ob.twitch.say(channel, '[A message that was supposed to be sent here was held back]');
		}
	},
};
