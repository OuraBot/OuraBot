import chalk from 'chalk';
import ob from '..';
import { Events } from '../Typings/Twitch';

export const event: Events = {
	name: 'ready',
	run: async (client) => {
		if (ob.debug) {
			const channels = ob.config.channels;

			ob.logger.info(`Ready (DEBUG) (${channels.length} channels)`, 'ob.twitch.events.ready');

			for (let channel of channels) {
				await ob.twitch.joinRateLimiter.take();
				ob.logger.info(`Joining #${chalk.bold(channel.login)}`, 'ob.twitch.events.ready');
				ob.twitch.chatClient
					.join(channel.login)
					.then(() => {
						ob.logger.info(`Joined #${chalk.bold(channel.login)}`, 'ob.twitch.events.ready');
					})
					.catch((err) => {
						ob.logger.warn(`Failed to join #${chalk.bold(channel.login)} (${err})`, 'ob.twitch.events.ready');
					});
			}
		} else {
			const channels = await ob.db.models.Channel.model.find({});
			ob.logger.info(`Ready (${chalk.bold(channels.length)} channels)`, 'ob.twitch.events.ready');

			ob.twitch.joinRateLimiter.MAX_LIMIT = 2000;
			ob.twitch.joinRateLimiter.REFILL_TIME = 10 * 1000;

			for (let channel of channels) {
				await ob.twitch.joinRateLimiter.take(channel.role > 0);
				ob.logger.info(`Joining #${chalk.bold(channel.login)}`, 'ob.twitch.events.ready');
				ob.twitch.chatClient
					.join(channel.login)
					.then(() => {
						ob.logger.info(`Joined #${chalk.bold(channel.login)}`, 'ob.twitch.events.ready');
						ob.channels.push({
							id: channel.id,
							login: channel.login,
							isMod: false,
						});
					})
					.catch((err) => {
						ob.logger.warn(`Failed to join #${chalk.bold(channel.login)} (${err})`, 'ob.twitch.events.ready');
					});
			}
		}

		// This is a horrible way to do this, but it works
		ob.twitch.chatClient.irc.onNamedMessage('USERSTATE', (msg) => {
			const channel = msg.rawParamValues[0].split(';');

			ob.channels.forEach((c) => {
				// ob.logger.debug(`Checking if ${c.login} === ${ob.utils.sanitizeName(channel[0])}`, 'ob.twitch.events.ready');
				if (c.login === ob.utils.sanitizeName(channel[0])) {
					c.isMod = msg.tags.get('mod') === '1';
					ob.logger.debug(`Updated mod status for ${c.login} to ${c.isMod}`, 'ob.twitch.events.ready');
				}
			});
		});
	},
};
