import { ApiClient } from '@twurple/api';
import { AuthProvider, RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient, ChatSayMessageAttributes } from '@twurple/chat';
import { PubSubClient } from '@twurple/pubsub';
import chalk from 'chalk';
import { exec, execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { EventEmitter } from 'events';
import * as _fs from 'fs';
import { promises as fs, writeFileSync } from 'fs-extra';
import Redis from 'ioredis';
import path from 'path';
import * as winston from 'winston';
import ob from '..';
import {
	ChannelRecentMessage,
	Command,
	Events,
	getCommands,
	getModules,
	Module,
	NukeMessage,
	OuraBotConfig,
	SelfRecentMessage,
	SimplifiedChannel,
	TwitchController,
} from '../Typings/Twitch';
import { AfkManager } from '../Utils/Afk';
import { API } from '../Utils/API';
import { EnvironmentVariables } from '../Utils/env';
import { eventBinder } from '../Utils/eventBinder';
import { MessageHeight } from '../Utils/MessageHeight';
import { Metric } from '../Utils/Metric';
import { Database } from '../Utils/Mongo';
import { CacheManager } from '../Utils/Redis/CacheManager';
import { EventManager } from '../Utils/Redis/EventManager';
import { ReminderManager } from '../Utils/Reminders';
import { SQLBlockUser, SQLite } from '../Utils/SQLite';
import Utils from '../Utils/utils';
import DailyRotateFile from 'winston-daily-rotate-file';
import { SimpleRateLimiter } from '../Utils/SimpleRateLimiter';
import gradient = require('gradient-string');
import { Counter, register } from 'prom-client';
dotenv.config({
	path: path.join(__dirname, '..', '..', '..', '.env'),
});

class OuraBot {
	twitch: TwitchController;
	config: OuraBotConfig;
	utils: Utils;
	clientEvent: EventEmitter;
	events: Map<string, Events> = new Map();
	commands: Map<string, Command> = new Map();
	modules: Map<string, Module> = new Map();
	nukeMessages: NukeMessage[] = new Array();
	activeSays: Set<string> = new Set();
	db: Database;
	sqlite: SQLite;
	channels: SimplifiedChannel[];
	debug: boolean;
	redis: Redis.Redis;
	subRedis: Redis.Redis;
	pubRedis: Redis.Redis;
	api: API;
	EventManager: EventManager;
	CacheManager: CacheManager;
	AfkManager: AfkManager;
	ReminderManager: ReminderManager;
	cancels: Set<string>;
	blockedUsers: SQLBlockUser[];
	MessageHeight: MessageHeight;
	logger: {
		debug: (message: any, label: string) => void;
		info: (message: any, label: string) => void;
		warn: (message: any, label: string) => void;
		error: (message: any, label: string) => void;
		fatal: (message: any, label: string) => void;
	};
	_logger: winston.Logger;
	// Command cooldowns
	cooldowns: {
		userCooldowns: Map<string, number>;
		channelCooldowns: Map<string, number>;
	};
	// EventManager rate limits
	rateLimits: {
		query: Map<string, SimpleRateLimiter>;
		update: Map<string, SimpleRateLimiter>;
	};
	recentMessages: {
		self: SelfRecentMessage[];
		channels: {
			[channel: string]: ChannelRecentMessage[];
		};
	};
	uptime: {
		url: string;
		interval: NodeJS.Timeout;
	};
	prometheus: {
		messages: Counter;
		botMessages: Counter;
		blockedBotMessages: Counter;
		messagesFailed: Counter;
		messagesRateLimited: Counter;
	};
	exec = exec;
	execSync = execSync;

	constructor() {
		let config = new OuraBotConfig(JSON.parse(_fs.readFileSync('../config.json', 'utf8')));

		this.config = config;
		this.channels = config.channels;
		this.utils = new Utils();
		this.cooldowns = {
			userCooldowns: new Map(),
			channelCooldowns: new Map(),
		};

		this.rateLimits = {
			query: new Map(),
			update: new Map(),
		};

		this.db = new Database();
		this.recentMessages = {
			self: [],
			channels: {},
		};

		const redisOpts = {
			keyPrefix: config.redisPrefix,
			showFriendlyErrorStack: true,
			maxRetriesPerRequest: 10,
			retryStrategy: (times: number) => {
				return times * 10 * 1000;
			},
			// lazyConnect lets use .catch() on Redis.connect() to handle errors
			lazyConnect: true,
		};

		this.redis = new Redis(redisOpts);
		this.subRedis = new Redis(redisOpts);
		this.pubRedis = new Redis(redisOpts);
		this.api = new API();
		this.sqlite = new SQLite(`../${this.config.sqlitePath}`);
		this.EventManager = new EventManager();

		this.CacheManager = new CacheManager();
		this.AfkManager = new AfkManager();
		this.ReminderManager = new ReminderManager();
		this.cancels = new Set();
		this.MessageHeight = new MessageHeight();
		this.uptime = {
			url: `https://status.mrauro.dev/api/push/VEqUco8a47?status=up&msg=OK`,
			interval: setInterval(() => {
				if (!ob.debug) {
					ob.api.get(this.uptime.url, 0);
				}
			}, 1000 * 45),
		};
		this.prometheus = {
			messages: new Counter({
				name: 'channel_messages',
				help: 'Total number of messages sent',
				labelNames: ['channel'],
			}),
			botMessages: new Counter({
				name: 'bot_messages',
				help: 'Total number of messages sent by the bot',
				labelNames: ['channel'],
			}),
			blockedBotMessages: new Counter({
				name: 'blocked_bot_messages',
				help: 'Total number of messages sent by the bot that were blocked',
				labelNames: ['channel'],
			}),
			messagesFailed: new Counter({
				name: 'channel_messages_failed',
				help: 'Total number of messages that failed to send',
				labelNames: ['channel', 'reason'],
			}),
			messagesRateLimited: new Counter({
				name: 'channel_messages_rate_limited',
				help: 'Total number of messages that were rate limited',
				labelNames: ['channel'],
			}),
		};
	}

	public async init() {
		this.utils.startNanoStopwatch('startup.ready');

		this.debug = EnvironmentVariables.DEBUG;

		// #region Logger
		const colors = {
			debug: 'blue',
			info: 'green',
			warn: 'yellow',
			error: 'red',
			fatal: 'magenta',
		};
		winston.addColors(colors);

		const transport = new DailyRotateFile({
			level: 'info',
			filename: '../logs/bot-%DATE%.log',
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '20m',
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.printf((info) => {
					return JSON.stringify(info);
				})
			),
		});

		// https://github.com/winstonjs/winston/issues/1338
		const print = winston.format.printf((info) => {
			const log = `${info.level}: ${info.message}`;

			return info.stack ? `${log}\n${info.stack}` : log;
		});

		this._logger = winston.createLogger({
			level: 'debug',
			levels: {
				debug: 4,
				info: 3,
				warn: 2,
				error: 1,
				fatal: 0,
			},
			format: winston.format.combine(winston.format.errors({ stack: true }), print),
			transports: [
				new winston.transports.Console({
					format: winston.format.combine(
						winston.format.align(),
						winston.format((info) => {
							// Winston's color only highlights the level
							info.color = colors[info.level as keyof typeof colors];
							info.level = info.level.toUpperCase();
							return info;
						})(),
						winston.format.timestamp({
							format: 'YYYY-MM-DD HH:mm:ss.SSS',
						}),
						winston.format.printf((info) => {
							return (
								chalk.blue(`[${info.timestamp}] `) +
								// @ts-ignore
								chalk.bold(chalk[info.color](`[${info.level}]`.padEnd(7, ' '))) +
								chalk.blue(`  ${info.label}`) +
								chalk.white(`${info.message}`) +
								(info.stack ? chalk.gray(`\n${info.stack}`) : '')
							);
						})
					),
				}),
				transport,
			],
		});

		this.logger = {
			debug: (message, label) => {
				this._logger.log({
					level: 'debug',
					message,
					label,
				});
			},
			info: (message, label) => {
				this._logger.log({
					level: 'info',
					message,
					label,
				});
			},
			warn: (message, label) => {
				this._logger.log({
					level: 'warn',
					message,
					label,
				});
			},
			error: (message, label) => {
				this._logger.log({
					level: 'error',
					message,
					label,
				});
			},
			fatal: async (message, label) => {
				this._logger.log({
					level: 'fatal',
					message,
					label,
				});
				// wait 1s for the logger to write the log to disk
				await new Promise((resolve) => setTimeout(resolve, 1000));
				// fatals are irrecoverable, so we exit
				process.exit(1);
			},
		};
		// #endregion

		if (!this.debug) {
			const nonDebugPuns = [
				"Debugging? Who needs it! I'm in production mode now!",
				"Starting up in production mode... let's hope I don't crash and burn!",
				'Ready or not, production mode, here I come!',
				"Time to show the world what I'm made of in production mode!",
				"No more training wheels for me, I'm a production mode pro!",
				'Debugging is for amateurs, production mode is for pros!',
				"Let's hope all the bugs are gone now that I'm in production mode!",
				"Production mode, baby! No more 'console.log()' for me!",
				"Starting up in production mode... let's hope there are no unexpected errors!",
				"Debugging? More like 'de-boring'. Production mode is where the fun is at!",
				'In production mode and ready to take on the world!',
				"Let's hope my code is as good as my dad jokes now that I'm in production mode!",
				"No more 'console.error()' for me, I'm in production mode!",
				'Production mode activated! Let the chatting commence!',
				"Debugging is for quitters. I'm in production mode now!",
				"It's showtime! I'm in production mode and ready to shine!",
				'Production mode: the moment I become a real bot.',
				"I've been training for this moment! Starting up in production mode!",
				"Let's hope I don't start glitching now that I'm in production mode!",
				"From beta to production mode. I'm officially a grown-up bot now!",
			];

			const randomPun = nonDebugPuns[Math.floor(Math.random() * nonDebugPuns.length)];
			console.log(gradient.rainbow(randomPun));
		}

		// #region MongoDB
		this.utils.startNanoStopwatch('startup.connect_to_mongo');
		await this.db.init();
		this.utils.stopNanoStopwatchAndLog('startup.connect_to_mongo');
		// #endregion

		// #region Redis
		this.utils.startNanoStopwatch('startup.connect_to_redis_cache');
		this.redis.connect().catch((err) => {
			this.logger.fatal(`Error connecting to Redis (CACHE): ${err}`, 'ob.startup.redis');
			this.redis.disconnect();
			process.exit(1);
		});
		this.redis.on('ready', () => {
			this.logger.info(`Redis (CACHE) is ready (${this.utils.stopNanoStopwatch('startup.connect_to_redis_cache')}ms)`, 'ob.startup.redis');
		});

		this.redis.on('error', (err) => {
			this.utils.attemptStopNanoStopwatch('startup.connect_to_redis_cache');
			this.logger.fatal(`Redis (CACHE) error: ${err}`, 'ob.startup.redis');
			this.redis.disconnect();
			process.exit(1);
		});

		this.utils.startNanoStopwatch('startup.connect_to_redis_sub');
		this.subRedis.connect().catch((err) => {
			this.logger.fatal(`Error connecting to Redis (SUBSCRIBE): ${err}`, 'ob.startup.redis');
			this.subRedis.disconnect();
			process.exit(1);
		});

		this.subRedis.on('ready', () => {
			this.logger.info(`Redis (SUBSCRIBE) is ready (${this.utils.stopNanoStopwatch('startup.connect_to_redis_sub')}ms)`, 'ob.startup.redis');
		});

		this.subRedis.on('error', (err) => {
			this.utils.attemptStopNanoStopwatch('startup.connect_to_redis_sub');
			this.logger.fatal(`Redis (SUBSCRIBE) error: ${err}`, 'ob.startup.redis');
			this.subRedis.disconnect();
			process.exit(1);
		});

		this.utils.startNanoStopwatch('startup.connect_to_redis_pub');
		this.pubRedis.connect().catch((err) => {
			this.logger.fatal(`Error connecting to Redis (PUBLISH): ${err}`, 'ob.startup.redis');
			this.pubRedis.disconnect();
			process.exit(1);
		});

		this.pubRedis.on('ready', () => {
			this.logger.info(`Redis (PUBLISH) is ready (${this.utils.stopNanoStopwatch('startup.connect_to_redis_pub')}ms)`, 'ob.startup.redis');
		});

		this.pubRedis.on('error', (err) => {
			this.utils.attemptStopNanoStopwatch('startup.connect_to_redis_pub');
			this.logger.fatal(`Redis (PUBLISH) error: ${err}`, 'ob.startup.redis');
			this.pubRedis.disconnect();
			process.exit(1);
		});
		// #endregion

		this.EventManager.init();

		// #region Commands
		this.utils.startNanoStopwatch('startup.init_commands');
		this.commands = await getCommands();
		this.utils.stopNanoStopwatchAndLog('startup.init_commands');
		// #endregion

		// #region Modules
		this.utils.startNanoStopwatch('startup.init_modules');
		this.modules = await getModules();
		this.utils.stopNanoStopwatchAndLog('startup.init_modules');
		// #endregion

		// Clear the cache to prevent any weird issues
		if (this.debug) {
			ob.CacheManager.clearAll();
		}

		// #region Twitch
		const tokenData = JSON.parse(await fs.readFile('../tokens.json', 'utf8'));
		const authProvider = new RefreshingAuthProvider({
			clientId: EnvironmentVariables.TWITCH_CLIENT_ID,
			clientSecret: EnvironmentVariables.TWITCH_CLIENT_SECRET,
			onRefresh: async (userId: string, newTokenData: any) => await fs.writeFile(`./tokens.json`, JSON.stringify(newTokenData, null, 4), 'utf8'),
		});

		await authProvider.addUserForToken(tokenData);
		authProvider.addIntentsToUser(ob.config.twitch_id, ['chat']);

		// The other connections are handled in the onRegister event (https://twurple.js.org/docs/faq/)
		this.channels = [
			{
				id: this.config.twitch_id,
				login: this.config.login,
				isMod: false,
			},
		];

		const chatClient = await this.createTwitchClient(
			authProvider,
			this.config.channels.map((channel) => channel.login)
		);

		chatClient.connect();

		let _chatClientSay = chatClient.say;
		chatClient.say = (channel: string, message: string): Promise<void> => {
			this.logger.warn(chalk.yellow(`Avoid using the listener client's say method. Use ob.twitch.say() instead.`), 'ob.startup.twitch');
			return _chatClientSay.call(chatClient, channel, message);
		};

		// sender clients
		// create an array of config.spamClients length
		let clients: ChatClient[] = [];
		Promise.all(
			[...Array(this.config.spamClients)].map(async (_, i) => {
				clients[i] = await this.createTwitchClient(authProvider, [this.config.owner]);
				clients[i].connect();
			})
		);

		const apiClient = new ApiClient({
			authProvider,
		});

		const pubSubClient = new PubSubClient({ authProvider });

		this.twitch = new TwitchController(chatClient, apiClient, pubSubClient, clients);

		this.clientEvent = eventBinder(this.twitch.chatClient);

		const eventPath = path.join(__dirname, '..', 'Events');
		fs.readdir(eventPath).then(async (files) => {
			for (const file of files) {
				// since the Commands folder is nested in here, we need to check if the file is actually a file
				if (file.endsWith('.js')) {
					const { event } = await import(`${eventPath}/${file}`);
					if (!event) {
						ob.logger.warn(chalk.yellow(`Event file ${file} does not export an event.`), 'ob.twitch.events');
					}
					this.events.set(event.name, event);
					this.clientEvent.on(event.name, event.run.bind(null, this));
					ob.logger.info(chalk.green(`Loaded event: ${event.name}`), 'ob.twitch.events');
				}
			}
		});
		// #endregion

		this.blockedUsers = await this.sqlite.getBlockedUsers();
		await this.restoreState();
	}

	public async saveState() {
		ob.logger.info(`Saving state in Redis...`, 'ob.state.save');
		await this.redis.set('state:' + 'nuke_messages', JSON.stringify(ob.nukeMessages ?? []));

		const cooldowns: { userCooldowns: { key: string; expiry: number }[]; channelCooldowns: { key: string; expiry: number }[] } = {
			userCooldowns: Array.from(ob.cooldowns.userCooldowns).map(([key, expiry]) => ({ key, expiry })) ?? [],
			channelCooldowns: Array.from(ob.cooldowns.channelCooldowns).map(([key, expiry]) => ({ key, expiry })) ?? [],
		};

		await this.redis.set('state:' + 'cooldowns', JSON.stringify(cooldowns));

		ob.logger.info(`State saved in Redis`, 'ob.state.save');
	}

	public async restoreState() {
		ob.logger.info(`Restoring state from Redis...`, 'ob.state.restore');
		const nukeMessages = JSON.parse(await this.redis.get('state:' + 'nuke_messages'));
		const cooldowns: { userCooldowns: { key: string; expiry: number }[]; channelCooldowns: { key: string; expiry: number }[] } = JSON.parse(
			await this.redis.get('state:' + 'cooldowns')
		);

		if (!nukeMessages && !cooldowns) return ob.logger.info(`No state found in Redis`, 'ob.state.restore');
		if (!cooldowns?.channelCooldowns) return ob.logger.info(`No channel cooldowns found in Redis`, 'ob.state.restore');
		if (!cooldowns?.userCooldowns) return ob.logger.info(`No user cooldowns found in Redis`, 'ob.state.restore');

		if (nukeMessages) {
			this.nukeMessages.push(...nukeMessages);
		}

		if (cooldowns) {
			for (const userCooldown of cooldowns.userCooldowns) {
				if (userCooldown.expiry > Date.now()) {
					ob.cooldowns.userCooldowns.set(userCooldown.key, userCooldown.expiry);
					setTimeout(() => {
						ob.cooldowns.userCooldowns.delete(userCooldown.key);
					}, userCooldown.expiry - Date.now());
				}
			}

			for (const channelCooldown of cooldowns.channelCooldowns) {
				if (channelCooldown.expiry > Date.now()) {
					ob.cooldowns.channelCooldowns.set(channelCooldown.key, channelCooldown.expiry);
					setTimeout(() => {
						ob.cooldowns.channelCooldowns.delete(channelCooldown.key);
					}, channelCooldown.expiry - Date.now());
				}
			}
		}

		ob.logger.info(
			`State restored from Redis (${nukeMessages?.length ?? 0} NM, ${ob.cooldowns?.channelCooldowns?.size ?? 0}/${cooldowns.channelCooldowns.length} CC, ${
				ob.cooldowns?.userCooldowns?.size ?? 0
			}/${cooldowns.userCooldowns.length} UC)`,
			'ob.state.restore'
		);
	}

	public async shutdown() {
		ob.logger.info(`Attempting to shutdown...`, 'ob.shutdown');

		if (this?.activeSays?.size === 0 && this?.twitch?.rateLimiter?.queue?.length === 0) {
			ob.logger.info(`Shutting down...`, 'ob.shutdown');
			await this.saveState();
			await this.twitch.chatClient.quit();
			await this.twitch.clients.forEach((client) => client.quit());
		} else {
			ob.logger.info(`Active say, delaying shutdown...`, 'ob.shutdown');
			await ob.utils.sleep(1000);
			await this.shutdown();
		}
	}

	// creates a chat client that has the .say() method interrupted to run through checks
	public async createTwitchClient(auth: AuthProvider, channels?: string[]): Promise<ChatClient> {
		let _chatClient: ChatClient;
		if (channels) {
			_chatClient = new ChatClient({
				channels: channels,
				botLevel: 'verified',
				isAlwaysMod: true,
				authProvider: auth,
			});
		} else {
			_chatClient = new ChatClient({
				channels: [this.config.owner],
				botLevel: 'verified',
				isAlwaysMod: true,
				authProvider: auth,
			});
		}

		const _chatClientSay = _chatClient.say;
		_chatClient.say = (channel: string, message: string, attributes?: ChatSayMessageAttributes): Promise<void> => {
			if (this.utils.messageContainsAscii(message)) {
				message = message.replace(this.utils.ASCII_REGEX, '[ASCII Art]').replace(/(\[ASCII Art\]\s?)+/g, '[ASCII Art]');
			}

			let slashMe = false;
			if (message.startsWith('/me ')) {
				message = message.replace(/^\/me /, '');
				slashMe = true;
			}

			message = message.replace(
				/^[.\/](help|w|disconnect|color|user|commercial|mod|unmod|vip|unvip|slow|slowoff|r9kbeta|r9kbetaoff|emoteonly|emoteonlyoff|subscribers|subscribersoff|followers|followersoff|host|unhost|raid|unraid|marker)\b/gi,
				''
			);

			// suffix any of [\.,#!$%\^&\*<>;:{}=\-_`~()] with a >󠀀< (invisible character between the brackets)
			message = message.replace(/^([,#!$%\^&\*<>;{}=\-_`~()])/g, '󠀀$1');

			message = slashMe ? `/me ${message}` : message;

			if (this.utils.isSafeMessage(message)) {
				ob.prometheus.botMessages.labels({ channel: ob.utils.sanitizeName(channel) }).inc();
				return _chatClientSay.call(_chatClient, channel, message, attributes);
			} else {
				ob.prometheus.blockedBotMessages.labels({ channel: ob.utils.sanitizeName(channel) }).inc();
				return _chatClientSay.call(_chatClient, channel, '[A message that was supposed to be sent here was held back]', attributes);
			}
		};

		_chatClient.onMessageFailed((channel, reason) => {
			ob.logger.info(`Message failed to send in #${channel}: ${reason}`, 'ob.twitch.events.messageFailed');
			ob.prometheus.messagesFailed.labels({ channel: channel, reason: reason }).inc();

			if (reason === 'msg_rejected_mandatory') {
				ob.twitch.say(channel, '[A message that was supposed to be sent here was held back]');
			}
		});

		_chatClient.onMessageRatelimit((channel) => {
			ob.logger.info(`Message rate limited in ${channel}`, 'ob.twitch.events.messageRateLimit');
			ob.prometheus.messagesRateLimited.labels({ channel: channel }).inc();
		});

		return _chatClient;
	}
}

export default OuraBot;
