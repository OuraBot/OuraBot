import chalk from 'chalk';
import ob from '..';
import { Events } from '../Typings/Twitch';
import { PubSubChannelRoleChangeMessage } from '@twurple/pubsub/lib';

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
						ob.logger.info(`Joined #${chalk.bold(channel.login)} (in debug)`, 'ob.twitch.events.ready');
						ob.channels.push({
							id: channel.id,
							login: channel.login,
							isMod: true, // debug mode so it doesn't matter
						});
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
				if (channel.banned?.length > 0) {
					ob.logger.info(`Skipping banned user ${channel.login}`, 'ob.twitch.events.ready');
					continue;
				}

				if (!ob.channels.find((c) => c.id === channel.id)) {
					ob.logger.info(`Already joined #${chalk.bold(channel.login)} - *NOT* skipping (testing)`, 'ob.twitch.events.ready');
				}

				await ob.twitch.joinRateLimiter.take(channel.role > 0);
				ob.logger.info(`Joining #${chalk.bold(channel.login)}`, 'ob.twitch.events.ready');

				ob.channels.push({
					id: channel.id,
					login: channel.login,
					isMod: false,
				});

				ob.twitch.chatClient
					.join(channel.login)
					.then(() => {
						ob.logger.info(`Joined #${chalk.bold(channel.login)}`, 'ob.twitch.events.ready');

						if (channel.alerts?.length > 0) {
							channel.alerts = channel.alerts.filter(
								(a) => a !== 'Failed to join channel. Please unban the bot with "/unban oura_bot" (if this persists, please contact support)'
							);

							channel.markModified('alerts');
							channel.save();

							ob.logger.info(`Removed join alert for ${channel.login}`, 'ob.twitch.events.ready');
						}

						ob.twitch.pubsubClient.onModAction(ob.config.twitch_id, channel.id, (data) => {
							ob.logger.debug(`Received mod action for ${channel.login}: ${data.type}`, 'ob.twitch.events.ready');

							switch (data.type) {
								case 'moderator_added':
									{
										let d = data as PubSubChannelRoleChangeMessage;
										if (d.targetUserId == ob.config.twitch_id) {
											ob.channels.find((c) => c.id === channel.id).isMod = true;
											ob.twitch.sayPreventDuplicateMessages(channel.login, `I am now moderator; all commands are now available!`);
										}
									}
									break;
								case 'moderator_removed':
									{
										let d = data as PubSubChannelRoleChangeMessage;
										if (d.targetUserId == ob.config.twitch_id) {
											ob.channels.find((c) => c.id === channel.id).isMod = false;
											ob.twitch.sayPreventDuplicateMessages(channel.login, `I am no longer moderator; bot functionality is now limited.`);
										}
									}
									break;
							}
						});
					})
					.catch((err) => {
						ob.logger.warn(`Failed to join #${chalk.bold(channel.login)} (${err})`, 'ob.twitch.events.ready');

						let alertMsg = 'Failed to join channel. Please unban the bot with "/unban oura_bot" (if this persists, please contact support)';
						if (!channel.alerts.includes(alertMsg)) {
							channel.alerts.push(alertMsg);
						}

						channel.markModified('alerts');
						channel.save();
					});
			}
		}

		// Don't register this event more than once (would occur when the bot would reconnect)
		if (!ob.twitch.onNamedMessageRegistered) {
			// This is a horrible way to do this, but it works
			ob.twitch.chatClient.irc.onNamedMessage('USERSTATE', (msg) => {
				ob.twitch.onNamedMessageRegistered = true;
				const channel = msg.rawParamValues[0].split(';');

				ob.channels.forEach((c) => {
					// ob.logger.debug(`Checking if ${c.login} === ${ob.utils.sanitizeName(channel[0])}`, 'ob.twitch.events.ready');
					if (c.login === ob.utils.sanitizeName(channel[0])) {
						c.isMod = msg.tags.get('mod') === '1';
						ob.logger.debug(`Updated mod status for ${c.login} to ${c.isMod}`, 'ob.twitch.events.ready');
					}
				});
			});
		}
	},
};
