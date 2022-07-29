import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import ob from '..';
import { Command, Events } from '../Typings/Twitch';

export const event: Events = {
	name: 'command',
	run: (client, channel: string, user: string, message: string, msg: TwitchPrivateMessage) => {
		ob.clientEvent.emit('message', channel, user, message, msg);
	},
};
