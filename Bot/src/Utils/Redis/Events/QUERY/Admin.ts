import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';
import os from 'os';
import { ChannelRecentMessage, NukeMessage, SelfRecentMessage, SimplifiedChannel } from '../../../../Typings/Twitch';
import { Afk } from '../../../Afk';

type Data = {
	node: {
		processMemoryUsage: number;
		systemMemoryUsage: number;
		systemMemory: number;
		cpuUsage: number;
		uptime: number;
	};

	twitch: {
		chat: {
			isConnected: boolean;
		};
		api: {
			lastKnownLimit: number;
			lastKnownRemainingRequests: number;
			lastKnownResetDate: Date;
		};
	};

	git: {
		commit: { hash: string; message: string; author: string; date: number };
		branch: string;
	};

	ob: {
		commandsSize: number;
		modulesSize: number;
		cooldowns: {
			userCooldownsSize: number;
			channelCooldownsSize: number;
		};
		nukeMessages: {
			[key: string]: number;
		};
		activeSaysSize: number;
		cacheSize: number;
		afks: Afk[];
		remindersSizes: number;
		channels: SimplifiedChannel[];
		recentMessages: {
			// Maximum length is 50
			self: SelfRecentMessage[];
			// Most recent 5 messages across all channels
			channels: {
				[channel: string]: ChannelRecentMessage[];
			};
		};
		metrics: {
			messages: {
				history: { [key: string]: { timestamp: number; rate: number }[] };
			};
		};
	};
};

export default function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		const channel = await ob.db.models.Channel.model.findOne({
			id: Event.userId,
		});

		if (channel.role !== 1)
			return resolve({
				...Event,
				status: StatusCodes.Forbidden,
				data: {
					message: 'missing permissions',
				},
			});

		let commit: { hash: string; message: string; author: string; date: number };
		let branch: string;

		try {
			commit = ob
				.execSync('git log -1 --pretty=%h%n%s%n%an%n%at')
				.toString()
				.split('\n')
				.map((line) => line.trim())
				.reduce(
					(acc, line, i) => {
						if (i === 0) acc.hash = line;
						else if (i === 1) acc.message = line;
						else if (i === 2) acc.author = line;
						else if (i === 3) acc.date = parseInt(line);
						return acc;
					},
					{ hash: '', message: '', author: '', date: 0 }
				);

			branch = ob.execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
		} catch (e) {
			commit = { hash: '', message: '', author: '', date: 0 };
			branch = '???';
		}

		let nukeMessages: { [key: string]: number } = {};

		ob.nukeMessages.forEach((msg: NukeMessage) => {
			nukeMessages[msg.channel] = (nukeMessages[msg.channel] || 0) + 1;
		});

		const afks = await ob.AfkManager.getAllAfks();

		const data: Data = {
			node: {
				processMemoryUsage: process.memoryUsage().heapUsed,
				systemMemoryUsage: process.memoryUsage().heapTotal,
				systemMemory: os.totalmem(),
				cpuUsage: os.loadavg()[0],
				uptime: os.uptime(),
			},

			twitch: {
				chat: {
					isConnected: ob.twitch.chatClient.isConnected,
				},
				api: {
					lastKnownLimit: ob.twitch.apiClient.lastKnownLimit,
					lastKnownRemainingRequests: ob.twitch.apiClient.lastKnownRemainingRequests,
					lastKnownResetDate: ob.twitch.apiClient.lastKnownResetDate,
				},
			},

			git: {
				commit,
				branch,
			},

			ob: {
				commandsSize: ob.commands.size,
				modulesSize: ob.modules.size,
				cooldowns: {
					userCooldownsSize: ob.cooldowns.userCooldowns.size,
					channelCooldownsSize: ob.cooldowns.channelCooldowns.size,
				},
				nukeMessages,
				activeSaysSize: ob.activeSays.size,
				cacheSize: await ob.CacheManager.size(),
				afks,
				remindersSizes: await ob.ReminderManager.getReminderCount(),
				channels: ob.channels,
				recentMessages: {
					self: ob.recentMessages.self,
					channels: ob.recentMessages.channels,
				},
				metrics: {
					messages: {
						history: ob.metrics.messages.history,
					},
				},
			},
		};

		resolve({
			...Event,
			status: StatusCodes.OK,
			data: {
				...data,
			},
		});
	});
}
