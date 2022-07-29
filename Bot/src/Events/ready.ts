import chalk from 'chalk';
import ob from '..';
import { Events } from '../Typings/Twitch';

export const event: Events = {
	name: 'ready',
	run: async (client) => {
		if (ob.debug) {
			const channels = ob.config.channels;
			console.log(`${chalk.green(`[Twitch]`)} Ready (DEBUG) (${channels.length} channels)`);

			for (let channel of channels) {
				await ob.twitch.joinRateLimiter.take();
				console.debug(`${chalk.green('[Twitch]')} Joining #${chalk.bold(channel.login)}`);
				ob.twitch.chatClient
					.join(channel.login)
					.then(() => {
						console.debug(`${chalk.green('[Twitch]')} Joined #${chalk.bold(channel.login)}`);
					})
					.catch((err) => {
						console.warn(`${chalk.yellow('[Twitch]')} Failed to join #${chalk.bold(channel.login)} (${err})`);
					});
			}
		} else {
			const channels = await ob.db.models.Channel.model.find({});
			console.log(`${chalk.green(`[Twitch]`)} Ready (${chalk.bold(channels.length)} channels)`);

			ob.twitch.joinRateLimiter.MAX_LIMIT = 2000;
			ob.twitch.joinRateLimiter.REFILL_TIME = 10 * 1000;

			for (let channel of channels) {
				await ob.twitch.joinRateLimiter.take(channel.role > 0);
				console.debug(`${chalk.green('[Twitch]')} Joining #${chalk.bold(channel.login)}`);
				ob.twitch.chatClient
					.join(channel.login)
					.then(() => {
						console.debug(`${chalk.green('[Twitch]')} Joined #${chalk.bold(channel.login)}`);
					})
					.catch((err) => {
						console.warn(`${chalk.yellow('[Twitch]')} Failed to join #${chalk.bold(channel.login)} (${err})`);
					});
			}
		}
	},
};
