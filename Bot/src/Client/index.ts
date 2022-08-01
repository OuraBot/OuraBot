import { ApiClient } from '@twurple/api';
import { AuthProvider, RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient, ChatSayMessageAttributes } from '@twurple/chat';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import * as _fs from 'fs';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs-extra';
import Redis from 'ioredis';
import path from 'path';
import {
	Command,
	Module,
	Events,
	getCommands,
	OuraBotConfig,
	SimplifiedChannel,
	TwitchController,
	getModules,
	NukeMessage,
	Channel,
	SelfRecentMessage,
	ChannelRecentMessage,
} from '../Typings/Twitch';
import { API } from '../Utils/API';
import { EnvironmentVariables } from '../Utils/env';
import { eventBinder } from '../Utils/eventBinder';
import { Database } from '../Utils/Mongo';
import { EventManager } from '../Utils/Redis/EventManager';
import { SevenTVEvents } from '../Utils/SevenTVEvents';
import { SQLBlockUser, SQLite } from '../Utils/SQLite';
import Utils from '../Utils/utils';
import { exec, execSync } from 'child_process';
import { CacheManager } from '../Utils/Redis/CacheManager';
import ob from '..';
import { AfkManager } from '../Utils/Afk';
import { ReminderManager } from '../Utils/Reminders';
import { ChalkConstants } from '../Utils/ChalkConstants';
import { MessageHeight } from '../Utils/MessageHeight';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
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
	cooldowns: {
		userCooldowns: Map<string, number>;
		channelCooldowns: Map<string, number>;
	};
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
	SevenTVEvents: SevenTVEvents;
	EventManager: EventManager;
	CacheManager: CacheManager;
	AfkManager: AfkManager;
	ReminderManager: ReminderManager;
	cancels: Set<string>;
	blockedUsers: SQLBlockUser[];
	MessageHeight: MessageHeight;
	recentMessages: {
		self: SelfRecentMessage[];
		channels: {
			[channel: string]: ChannelRecentMessage[];
		};
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
			lazyConnect: true,
		};

		this.redis = new Redis(redisOpts);
		this.subRedis = new Redis(redisOpts);
		this.pubRedis = new Redis(redisOpts);
		this.api = new API();
		this.sqlite = new SQLite(`./${this.config.sqlitePath}`);
		this.SevenTVEvents = new SevenTVEvents();
		this.EventManager = new EventManager();

		this.CacheManager = new CacheManager();
		this.AfkManager = new AfkManager();
		this.ReminderManager = new ReminderManager();
		this.cancels = new Set();
		this.MessageHeight = new MessageHeight();
	}

	public async init() {
		this.utils.startNanoStopwatch('startup.ready');

		this.debug = EnvironmentVariables.DEBUG;

		// #region MongoDB
		this.utils.startNanoStopwatch('startup.connect_to_mongo');
		await this.db.init();
		this.utils.stopNanoStopwatchAndLog('startup.connect_to_mongo');
		// #endregion

		// #region Redis
		this.utils.startNanoStopwatch('startup.connect_to_redis_cache');
		this.redis.connect().catch((err) => {
			console.error(`${ChalkConstants.ALERT('[REDIS]')} Error connecting to Redis (CACHE): ${err}`);
			this.redis.disconnect();
			process.exit(1);
		});
		this.redis.on('ready', () => {
			console.log(`${ChalkConstants.LOG('[REDIS]')} Redis (CACHE) is ready (${this.utils.stopNanoStopwatch('startup.connect_to_redis_cache')}ms)`);
		});

		this.redis.on('error', (err) => {
			this.utils.attemptStopNanoStopwatch('startup.connect_to_redis_cache');
			console.warn(`${ChalkConstants.ALERT('[REDIS]')} Redis (CACHE) error: ${err}`);
		});

		this.utils.startNanoStopwatch('startup.connect_to_redis_sub');
		this.subRedis.connect().catch((err) => {
			console.error(`${ChalkConstants.ALERT('[REDIS]')} Error connecting to Redis (SUBSCRIBE): ${err}`);
			this.subRedis.disconnect();
			process.exit(1);
		});

		this.subRedis.on('ready', () => {
			console.log(`${ChalkConstants.LOG('[REDIS]')} Redis (SUBSCRIBE) is ready (${this.utils.stopNanoStopwatch('startup.connect_to_redis_sub')}ms)`);
		});

		this.subRedis.on('error', (err) => {
			this.utils.attemptStopNanoStopwatch('startup.connect_to_redis_sub');
			console.warn(`${ChalkConstants.ALERT('[REDIS]')} Redis (SUBSCRIBE) error: ${err}`);
		});

		this.utils.startNanoStopwatch('startup.connect_to_redis_pub');
		this.pubRedis.connect().catch((err) => {
			console.error(`${ChalkConstants.ALERT('[REDIS]')} Error connecting to Redis (PUBLISH): ${err}`);
			this.pubRedis.disconnect();
			process.exit(1);
		});

		this.pubRedis.on('ready', () => {
			console.log(`${ChalkConstants.LOG('[REDIS]')} Redis (PUBLISH) is ready (${this.utils.stopNanoStopwatch('startup.connect_to_redis_pub')}ms)`);
		});

		this.pubRedis.on('error', (err) => {
			this.utils.attemptStopNanoStopwatch('startup.connect_to_redis_pub');
			console.warn(`${ChalkConstants.ALERT('[REDIS]')} Redis (PUBLISH) error: ${err}`);
		});
		// #endregion

		if (!this.debug) this.SevenTVEvents.init();

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
		const authProvider = new RefreshingAuthProvider(
			{
				clientId: EnvironmentVariables.TWITCH_CLIENT_ID,
				clientSecret: EnvironmentVariables.TWITCH_CLIENT_SECRET,
				onRefresh: async (newTokenData) => {
					await fs.writeFile('../tokens.json', JSON.stringify(newTokenData, null, 4), 'utf8');
				},
			},
			tokenData
		);

		// The other connections are handled in the onRegister event (https://twurple.js.org/docs/faq/)
		this.channels = [
			{
				id: this.config.twitch_id,
				login: this.config.login,
			},
		];

		const chatClient = await this.createTwitchClient(
			authProvider,
			this.config.channels.map((channel) => channel.login)
		);
		chatClient.connect();

		let _chatClientSay = chatClient.say;
		chatClient.say = (channel: string, message: string): Promise<void> => {
			console.warn(chalk.yellow(`Avoid using the listener client's say method. Use ob.twitch.say() instead.`));
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

		this.twitch = new TwitchController(chatClient, apiClient, clients);

		this.clientEvent = eventBinder(this.twitch.chatClient);

		const eventPath = path.join(__dirname, '..', 'Events');
		fs.readdir(eventPath).then(async (files) => {
			for (const file of files) {
				// since the Commands folder is nested in here, we need to check if the file is actually a file
				if (file.endsWith('.js')) {
					const { event } = await import(`${eventPath}/${file}`);
					this.events.set(event.name, event);
					this.clientEvent.on(event.name, event.run.bind(null, this));
				}
			}
		});
		// #endregion

		this.blockedUsers = await this.sqlite.getBlockedUsers();
		await this.restoreState();
	}

	public async saveState() {
		console.log(`${ChalkConstants.LOG('[STATE]')} Saving state in Redis...`);
		await this.redis.set(ob.config.redisPrefix + ':' + 'state:' + 'nuke_messages', JSON.stringify(ob.nukeMessages ?? []));

		const cooldowns: { userCooldowns: { key: string; expiry: number }[]; channelCooldowns: { key: string; expiry: number }[] } = {
			userCooldowns: Array.from(ob.cooldowns.userCooldowns).map(([key, expiry]) => ({ key, expiry })) ?? [],
			channelCooldowns: Array.from(ob.cooldowns.channelCooldowns).map(([key, expiry]) => ({ key, expiry })) ?? [],
		};

		await this.redis.set(ob.config.redisPrefix + ':' + 'state:' + 'cooldowns', JSON.stringify(cooldowns));
		console.log(`${ChalkConstants.LOG('[STATE]')} State saved in Redis`);
	}

	public async restoreState() {
		console.log(`${ChalkConstants.LOG('[STATE]')} Restoring state from Redis...`);
		const nukeMessages = JSON.parse(await this.redis.get(ob.config.redisPrefix + ':' + 'state:' + 'nuke_messages'));
		const cooldowns: { userCooldowns: { key: string; expiry: number }[]; channelCooldowns: { key: string; expiry: number }[] } = JSON.parse(
			await this.redis.get(ob.config.redisPrefix + ':' + 'state:' + 'cooldowns')
		);

		if (!nukeMessages && !cooldowns) return console.log(`${ChalkConstants.LOG('[STATE]')} No state found in Redis`);
		if (!cooldowns?.channelCooldowns) return console.log(`${ChalkConstants.LOG('[STATE]')} No channel cooldowns found in Redis`);
		if (!cooldowns?.userCooldowns) return console.log(`${ChalkConstants.LOG('[STATE]')} No user cooldowns found in Redis`);

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

		console.log(
			`${ChalkConstants.LOG('[STATE]')} State restored from Redis (${nukeMessages?.length ?? 0} NM, ${ob.cooldowns?.channelCooldowns?.size ?? 0}/${
				cooldowns.channelCooldowns.length
			} CC, ${ob.cooldowns?.userCooldowns?.size ?? 0}/${cooldowns.userCooldowns.length} UC)`
		);
	}

	public async shutdown() {
		console.log(`${ChalkConstants.ALERT('[SHUTDOWN]')} Attempting to shutdown...`);

		if (this?.activeSays?.size === 0 && this?.twitch?.rateLimiter?.queue?.length === 0) {
			console.log(`${ChalkConstants.ALERT('[SHUTDOWN]')} Shutting down...`);
			await this.saveState();
			await this.twitch.chatClient.quit();
			await this.twitch.clients.forEach((client) => client.quit());
		} else {
			console.log(`${ChalkConstants.ALERT('[SHUTDOWN]')} Active say, delaying shutdown...`);
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
				return _chatClientSay.call(_chatClient, channel, message, attributes);
			} else {
				return _chatClientSay.call(_chatClient, channel, '[A message that was supposed to be sent here was held back]', attributes);
			}
		};

		return _chatClient;
	}
}

export default OuraBot;
