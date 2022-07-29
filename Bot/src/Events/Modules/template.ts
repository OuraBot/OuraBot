import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import chalk from 'chalk';
import OuraBot from '../../Client';
import { Module, CommandReturn, Channel } from '../../Typings/Twitch';

export const module = new (class module implements Module {
	name = 'template';
	description = 'template module';
	hidden = true;
	execute = async (ob: OuraBot, user: string, Channel: Channel, message: string, msg: TwitchPrivateMessage): Promise<void> => {
		console.log('Template module ran');
	};
})();
