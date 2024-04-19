import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import chalk from 'chalk';
import ob from '..';
import { Channel, Command, Events, Permission } from '../Typings/Twitch';
import { Counter, contentType } from 'prom-client';
import axios from 'axios';

export const event: Events = {
	name: 'message',
	run: async (client, _channel: string, user: string, message: string, msg: TwitchPrivateMessage) => {
		if (!ob.channels.find((c) => c.id === msg.userInfo.userId)) return;

		if (user === ob.config.login) {
			let channels = [...ob.channels];
			let channel = channels.find((c) => c.id === msg.userInfo.userId);
			channel.isMod = msg.userInfo.isMod;
			ob.channels = channels;

			ob.logger.info(`Updated mod status for ${channel.login} to ${msg.userInfo.isMod}`, 'ob.twitch.events.message');
		}

		if (!ob.channels.find((c) => c.id === msg.userInfo.userId).isMod) {
			ob.logger.debug(`Bot is not a mod, skipping...`, 'ob.twitch.events.message');
			return;
		}

		ob.logger.info(`${chalk.bold(`[${_channel}]`)} @${user}: ${chalk.italic(message)}`, 'ob.twitch.events.message');
		ob.utils.startNanoStopwatch(`interal_message_delay_${msg.id}`);

		if (ob.msgsSent[_channel] == undefined) ob.msgsSent[_channel] = 0;
		ob.msgsSent[_channel]++;
		ob.logger.debug(`Message count for ${_channel}: ${ob.msgsSent[_channel]}`, 'ob.twitch.events.message');

		if (ob.msgsSent[_channel] > 1000) {
			axios.post(`https://ntfy.sh/ban_alerts_ouvZBWFjvZG5PVBc`, `Banned ${_channel} for spamming in channel`);

			ob.db.models.Channel.model
				.findOneAndUpdate({ id: msg.channelId }, { banned: 'Spamming in channel. Contact support', alerts: ['Spamming in channel. Contact support'] })
				.exec();

			ob.twitch.chatClient.part(_channel);
		}

		ob.prometheus.messages.labels({ channel: _channel.replace('#', '') }).inc();

		const channel = new Channel(_channel, msg);
		if (!(await channel.fetchDatabaseData())) {
			ob.logger.warn(`Channel ${_channel} not found in database, parting...`, 'ob.twitch.events.message');
			ob.twitch.chatClient.part(_channel);
		}

		ob.sqlite.addMessage(msg.userInfo.userId, channel.id, message);

		// Module Handler
		const modules = channel.modules;
		ob.modules.forEach((module) => {
			for (const moduleKey in modules) {
				if (moduleKey === module.name) {
					// @ts-ignore
					const moduleData = modules[moduleKey];

					try {
						if (moduleData.enabled) {
							ob.logger.debug(`Executing module "${module.name}" in ${channel.channel} (${channel.id})`, 'ob.twitch.events.message');
							module.execute(ob, user, channel, message, msg, moduleData);
						} else {
							// ob.logger.debug(`Module "${module.name}" in ${channel.channel} (${channel.id}) is disabled`, 'ob.twitch.events.message');
						}
					} catch (e) {
						ob.logger.warn(`Error executing module "${module.name}" in ${channel.channel} (${channel.id}): ${e}`, 'ob.twitch.events.message');
					}
				}
			}
		});

		// Nuke Messages
		let cantTimeout = msg.userInfo?.isMod || msg.userInfo.isBroadcaster;
		if (!cantTimeout)
			ob.nukeMessages.push({
				channel: channel.channel,
				message: message,
				user: user,
				user_id: msg.userInfo.userId,
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
					const isMod = ob.channels.find((c) => c.login == ob.utils.sanitizeName(channel.channel))?.isMod;

					if (!isMod && !ob.debug)
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
								if (result.message) {
									ob.prometheus.commands.labels({ command: targetCmd.name }).inc();
									ob.twitch.say(channel.channel, `${result.message}`, undefined, undefined, result?.noping ? undefined : msg.id);
								}
							} else {
								// TODO: banphrase checking
								ob.prometheus.commandsUnsuccessful.labels({ command: targetCmd.name }).inc();
								ob.twitch.say(channel.channel, `command unsuccessful: ${result.message}`, undefined, undefined, result?.noping ? undefined : msg.id);
							}
						})
						.catch((err) => {
							if (err instanceof Error) {
								ob.logger.error(err, 'ob.commands.execute');
							} else {
								ob.logger.error(new Error(err), 'ob.commands.execute');
							}
							ob.prometheus.commandsErrored.labels({ command: targetCmd.name }).inc();
							ob.twitch.say(channel.channel, `there was an unknown error while executing the command`, undefined, undefined, msg.id);
						});
				}
			}
		}
	},
};
