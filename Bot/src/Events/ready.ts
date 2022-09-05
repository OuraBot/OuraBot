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
					})
					.catch((err) => {
						ob.logger.warn(`Failed to join #${chalk.bold(channel.login)} (${err})`, 'ob.twitch.events.ready');
					});
			}
		}
	},
};
