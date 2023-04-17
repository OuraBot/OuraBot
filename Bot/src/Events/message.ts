import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import chalk from 'chalk';
import ob from '..';
import { Channel, Command, Events, Permission } from '../Typings/Twitch';
import { Metric } from '../Utils/Metric';

export const event: Events = {
	name: 'message',
	run: async (client, _channel: string, user: string, message: string, msg: TwitchPrivateMessage) => {
		if (user === ob.config.login) return;

		ob.logger.info(`${chalk.bold(`[${_channel}]`)} @${user}: ${chalk.italic(message)}`, 'ob.twitch.events.message');
		ob.utils.startNanoStopwatch(`interal_message_delay_${msg.id}`);

		if (ob.utils.keyInObject(_channel, ob.metrics.messages.managers)) {
			ob.metrics.messages.managers[_channel].trigger();
		} else {
			ob.metrics.messages.managers[_channel] = new Metric();
		}

		const channel = new Channel(_channel, msg);
		if (!(await channel.fetchDatabaseData())) {
			ob.logger.warn(`Channel ${_channel} not found in database, parting...`, 'ob.twitch.events.message');
			ob.twitch.chatClient.part(_channel);
		}

		ob.sqlite.addMessage(msg.userInfo.userId, channel.id, message);

		// Module Handler
		const enabledModules = channel.enabledModules;
		for (const module of enabledModules) {
			let moduleInstance = ob.modules.get(module);
			if (!moduleInstance) {
				ob.logger.warn(`Attempted to load module "${module}" in ${channel.channel} (${channel.id}) but it doesn't exist.`, 'ob.twitch.events.message');
				continue;
			}

			moduleInstance.execute(ob, user, channel, message, msg);
		}

		// Nuke Messages
		let cantTimeout = msg.userInfo.isMod || msg.userInfo.isBroadcaster;
		if (!cantTimeout)
			ob.nukeMessages.push({
				channel: channel.channel,
				message: message,
				user: user,
				sentAt: Date.now(),
			});

		ob.nukeMessages = ob.nukeMessages.filter((m) => Date.now() - m.sentAt < 1000 * 60 * 30);

		// Blocked Users
		const blockedData = ob.blockedUsers.filter((blockedUser) => blockedUser.userId === msg.userInfo.userId);
		if (blockedData.length > 0) {
			if (blockedData[0].commands.length == 0) return;
		}

		// Users
		ob.sqlite.createUser(msg.userInfo.userId, new Date());

		// Reminder Handler
		ob.ReminderManager.getReminders(msg.userInfo.userId).then(async (reminders) => {
			let reminderMessages = [];
			for (let reminder of reminders) {
				reminderMessages.push(`${reminder.user}: ${reminder.message} (${ob.utils.timeDelta(reminder.date)})`);
				reminder.delete();
			}

			let messages = ob.utils.chunkArr(reminderMessages, 450).map((msg) => `@${user}, reminders - ${msg}`);
			if (messages.length > 0) ob.twitch.say(channel, messages);
		});

		// Afk Handler
		ob.AfkManager.getAfks(msg.userInfo.userId).then((afks) => {
			afks?.forEach((afk) => {
				if (afk.pending) return;
				afk.pendDeletion();
				switch (afk.status) {
					case 'food':
						ob.twitch.say(channel, `@${user} is no longer eating: ${afk.message} (${ob.utils.timeDelta(afk.time)})`);
						break;

					case 'gn':
						ob.twitch.say(channel, `@${user} just woke up: ${afk.message} (${ob.utils.timeDelta(afk.time)})`);
						break;

					case 'lurk':
						ob.twitch.say(channel, `@${user} is no longer lurking: ${afk.message} (${ob.utils.timeDelta(afk.time)})`);
						break;

					default:
						ob.twitch.say(channel, `@${user} is no longer AFK: ${afk.message} (${ob.utils.timeDelta(afk.time)})`);
						break;
				}
			});
		});

		// Command Handler
		const prefixRegex = new RegExp(`^${channel.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
		if (prefixRegex.test(message)) {
			const args = message.split(/\s+/);
			const commandName = args.shift().replace(prefixRegex, '');
			let targetCmd: Command;
			let targetAlias: string;

			ob.commands.forEach((cmd) => {
				if (cmd.name == commandName) {
					targetAlias = cmd.name;
					targetCmd = cmd;
				}
				if (cmd.aliases) {
					cmd.aliases.forEach((alias) => {
						if (alias == commandName) {
							targetAlias = alias;
							targetCmd = cmd;
						}
					});
				}
			});

			if (targetCmd) {
				const cmdOptions = channel.defaultCommandOptions.find((o) => o.name == targetCmd.name);
				let enabled = true;
				targetCmd.chatMode = 'both';
				if (cmdOptions) {
					targetCmd.chatMode = cmdOptions.chatMode;
					targetCmd.userCooldown = cmdOptions.modifiedUserCooldown;
					targetCmd.channelCooldown = cmdOptions.modifiedChannelCooldown;
					if (targetCmd.modifiablePermissions) {
						targetCmd.permissions = cmdOptions.modifiedPermissions as Permission[];
					}
					enabled = cmdOptions.enabled ?? true;
				}

				if (!enabled) return;

				if (ob.utils.canUseCommand(user, channel, targetCmd, msg)) {
					const isMod = ob.channels.find((c) => c.login == ob.utils.sanitizeName(channel.channel)).isMod;

					if (!isMod)
						return ob.twitch.say(
							channel.channel,
							`I need to be moderator to use any commands. Please contact the channel owner to make me a moderator.`,
							undefined,
							undefined,
							msg.id
						);

					if (targetCmd.chatMode !== 'both') {
						const isOnline = await ob.CacheManager.cache(
							async () => {
								const streamInfo = await ob.twitch.apiClient.streams.getStreamByUserId(channel.id);
								return streamInfo ? true : false;
							},
							`${msg.channelId}_isOnline`,
							60
						);

						if (targetCmd.chatMode == 'online' && !isOnline) return;
						if (targetCmd.chatMode == 'offline' && isOnline) return;
					}

					targetCmd
						.execute(ob, user, channel, args, message, msg, targetAlias)
						.then((result) => {
							ob.sqlite.logUsage(msg.userInfo.userId, channel.id, targetCmd.name, message, result.success, result.message ?? '<null>');

							if (result.success) {
								// TODO: banphrase checking
								if (result.message) ob.twitch.say(channel.channel, `${result.message}`, undefined, undefined, result?.noping ? undefined : msg.id);
							} else {
								// TODO: banphrase checking
								ob.twitch.say(channel.channel, `command unsuccessful: ${result.message}`, undefined, undefined, result?.noping ? undefined : msg.id);
							}
						})
						.catch((err) => {
							if (err instanceof Error) {
								ob.logger.error(err, 'ob.commands.execute');
							} else {
								ob.logger.error(new Error(err), 'ob.commands.execute');
							}
							ob.twitch.say(channel.channel, `there was an unknown error while executing the command`, undefined, undefined, msg.id);
						});
				}
			}
		}
	},
};
