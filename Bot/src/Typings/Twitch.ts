import { ApiClient } from '@twurple/api';
import { ChatClient } from '@twurple/chat';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import { PubSubClient } from '@twurple/pubsub/lib';
import chalk from 'chalk';
import { DefaultCommandOption, Modules } from '../../../Common';
import { promises as fs } from 'fs-extra';
import ob from '..';
import OuraBot from '../Client';
import { CacheTimes } from '../Utils/API/constants';
import { ChatClientEvents } from '../Utils/eventBinder';
import { RateLimiter } from '../Utils/RateLimiter';
import { TMIChatters } from './API';

const CHUNK_SIZE = 3000;

export class OuraBotConfig {
	owner: string;
	channels: SimplifiedChannel[];
	prefix: string;
	admins: TwitchId[];
	twitch_id: TwitchId;
	ambassadors: TwitchId[];
	redisPrefix?: string;
	spamClients?: number;
	sqlitePath?: string;
	displayName?: string;
	login?: string;

	constructor(config: any) {
		this.owner = config.owner;
		this.channels = config.channels;
		this.prefix = config.prefix;
		this.admins = config.admins;
		this.twitch_id = config?.twitch_id || '652867592';
		this.ambassadors = config.ambassadors;
		this.redisPrefix = config?.redisPrefix || 'obv3';
		this.spamClients = config?.spamClients || 10;
		this.sqlitePath = config?.sqlitePath || 'sqlite.db';
		this.displayName = config?.displayName || 'Oura_Bot';
		this.login = config?.login || 'oura_bot';
	}
}

export class TwitchController {
	chatClient: ChatClient;
	apiClient: ApiClient;
	pubsubClient: PubSubClient;
	clients: ChatClient[];
	rateLimiter: RateLimiter;
	joinRateLimiter: RateLimiter;
	onNamedMessageRegistered: boolean = false;
	private lastIndex: number = 0;

	private recentMessages: {
		timestamp: number;
		channel: string;
		message: string;
	}[] = [];

	constructor(chatClient: ChatClient, apiClient: ApiClient, pubSubClient: PubSubClient, clients: ChatClient[]) {
		this.chatClient = chatClient;
		this.apiClient = apiClient;
		this.pubsubClient = pubSubClient;
		this.clients = clients;
		this.rateLimiter = new RateLimiter();
		this.joinRateLimiter = new RateLimiter();

		pubSubClient.onCustomTopic(ob.config.twitch_id, 'chatrooms-user-v1', async (msg) => {
			const data: ChatroomMessage = msg.data as ChatroomMessage;

			if (data.type === 'channel_banned_alias_restriction_update') {
				if (!data.data.user_is_restricted) {
					const channel = await ob.db.models.Channel.model.findOne({ id: data.data.ChannelID });

					if (channel) {
						ob.twitch.chatClient.join(channel.login);
						ob.twitch.say(channel.login, `MrDestructoid Reconnected to channel`);
					}
				}
			}
		});

		// TODO: Subscribe to PubSubChannelRoleChangeMessage (https://github.com/twurple/twurple/commit/8f29a2b1e6e9354eb7d169114b30014f21133ade)
	}

	async sayPreventDuplicateMessages(channel: string, message: string) {
		let timestamp = Date.now();
		this.recentMessages.push({ timestamp, channel, message });
		console.log('A', this.recentMessages, timestamp, channel, message);
		if (this.recentMessages.filter((m) => m.channel === channel && m.message === message).length > 1) return;
		console.log('B', this.recentMessages, timestamp, channel, message);

		await this.say(channel, message);

		setTimeout(() => {
			this.recentMessages = this.recentMessages.filter((m) => m.timestamp !== timestamp);
			console.log('C', this.recentMessages, timestamp, channel, message);
		}, 1000);
	}

	async say(
		channel: string | Channel | SimplifiedChannel,
		messages: string | string[],
		delay: number = 0.01,
		type: 'filesay' | 'pyramid' | 'spam' | 'bingall' | 'nuke' | null = null,
		replyTo?: string
	) {
		if (typeof channel === 'string') {
			channel = channel;
		} else if (channel instanceof Channel) {
			channel = channel.channel;
		} else if (channel instanceof SimplifiedChannel) {
			channel = channel.login;
		} else {
			throw new Error('Invalid channel type');
		}

		if (typeof messages === 'string') {
			await this.rateLimiter.take(true);
			this.getClient().say(channel, messages, { replyTo: replyTo || undefined });
		} else {
			ob.activeSays.add(ob.utils.generateMD5(channel + type));
			for (let i = 0; i < messages.length; i++) {
				if (ob.cancels.has(channel)) {
					ob.cancels.delete(channel);
					this.say(channel, `Stopped current ${type ?? '<unknown type>'} on index: ${i}`);
					ob.activeSays.delete(ob.utils.generateMD5(channel + type));
					break;
				} else {
					await this.rateLimiter.take();
					this.getClient().say(channel, messages[i]);
					await new Promise((resolve) => setTimeout(resolve, delay * 1000));
				}

				if (i === messages.length - 1) {
					ob.activeSays.delete(ob.utils.generateMD5(channel + type));
				}
			}
		}
	}

	getClient(): ChatClient {
		// https://discordapp.com/channels/325552783787032576/1084914772631371826/1084916752275734571 for using irc.isConnected instead of isConnected
		const readyClients = ob.twitch.clients.filter((client: ChatClient) => client.irc.isConnected);
		return readyClients[this.lastIndex++ % readyClients.length];
	}
}

export type TwitchId = string;

// https://github.com/KingOKarma/TwitchBotTemplate/blob/main/src/interfaces/events.ts
type Run = (client: ChatClient, ...args: any[]) => void;

export interface Events {
	name: ChatClientEvents;
	run: Run;
}

export class CommandReturn {
	success: boolean;
	message: string;
	reducedCooldown?: number;
	noping?: boolean;
}

export enum PlatformEnum {
	Twitch,
	Kick,
}

export interface Command {
	name: string;
	description: string;
	extendedDescription?: string;
	usage: string;
	userCooldown: number;
	channelCooldown: number;
	aliases?: string[];
	permissions?: Permission[];
	ownerOnly?: boolean;
	hidden?: boolean;
	requiresMod?: boolean;
	requiresFastLimits?: boolean;
	disabledByDefault?: boolean;
	modifiablePermissions?: boolean;
	chatMode?: 'online' | 'both' | 'offline';
	category: CategoryEnum;
	platforms: PlatformEnum[];
	execute: (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string) => Promise<CommandReturn>;
}

export enum CategoryEnum {
	Utility = 'Utility',
	Fun = 'Fun',
	Moderation = 'Moderation',
}

export interface Module {
	name: string;
	description: string;
	requiresMod?: boolean;
	hidden?: boolean;
	execute: (ob: OuraBot, user: string, channel: Channel, message: string, msg: TwitchPrivateMessage, data?: any) => void;
}

export enum Permission {
	Owner = 'Owner',
	Admin = 'Admin',
	Broadcaster = 'Broadcaster',
	Moderator = 'Moderator',
	VIP = 'VIP',
	Subscriber = 'Subscriber',
}

export function hasPermission(requiredPermissions: Permission[], user: string, channel: string, msg: TwitchPrivateMessage): boolean {
	const permissions: Permission[] = [];

	// Owner and admins have all permissions
	if (user === ob.config.owner) return true;
	if (ob.config.admins.includes(msg.userInfo.userId)) return true;

	if (msg.userInfo.isBroadcaster) permissions.push(Permission.Broadcaster);
	if (msg.userInfo.isMod) permissions.push(Permission.Moderator);
	if (msg.userInfo.isVip) permissions.push(Permission.VIP);
	if (msg.userInfo.isSubscriber) permissions.push(Permission.Subscriber);

	ob.logger.debug(
		`User: ${user} | Channel: ${channel} | Permissions: ${permissions.join(', ')} | Required Permissions: ${requiredPermissions.join(', ')}`,
		'ob.twitch.permissions'
	);

	if (requiredPermissions.length === 0) return true;

	for (const permission of requiredPermissions) {
		if (permissions.includes(permission)) return true;
	}

	return false;
}

export async function getCommands(): Promise<Map<string, Command>> {
	return new Map(
		(await fs.readdir('./src/Events/Commands')).map((file) => {
			delete require.cache[require.resolve(`../Events/Commands/${file.replace('.ts', '')}`)];
			const cmd = require(`../Events/Commands/${file.replace('.ts', '')}`);
			ob.logger.info(chalk.green(`Loaded command: ${cmd.cmd.name}`), 'ob.twitch.commands');
			return [cmd.cmd.name, cmd.cmd];
		})
	);
}

export async function getModules(): Promise<Map<string, Module>> {
	return new Map(
		(await fs.readdir('./src/Events/Modules')).map((file) => {
			delete require.cache[require.resolve(`../Events/Modules/${file.replace('.ts', '')}`)];
			const module = require(`../Events/Modules/${file.replace('.ts', '')}`);
			ob.logger.info(chalk.green(`Loaded module: ${module._module.name}`), 'ob.twitch.modules');
			return [module._module.name, module._module];
		})
	);
}

export class Channel {
	public channel: string;
	public id: string;
	public modules: Modules;
	public prefix: string;
	public mongoId: string;
	public emoteEvents: boolean;
	public defaultCommandOptions: DefaultCommandOption[] = [];
	public clipUrl: string;
	public lastfmUsername: string;

	constructor(channel: string, msg: TwitchPrivateMessage) {
		this.channel = ob.utils.sanitizeName(channel);
		this.id = msg.channelId;
	}

	async fetchDatabaseData(): Promise<boolean> {
		const channelData = await ob.CacheManager.cache(
			async () => {
				const data = await ob.db.models.Channel.model.findOne({ id: this.id });
				return data;
			},
			`${this.id}_channelInfo`,
			CacheTimes.ChannelInfo
		);

		if (!channelData) return false;

		this.prefix = channelData.prefix;
		this.mongoId = channelData._id;
		this.modules = channelData.modules;
		this.emoteEvents = channelData.emoteEvents;
		this.defaultCommandOptions = channelData.defaultCommandOptions;
		this.clipUrl = channelData.clipUrl;
		this.lastfmUsername = channelData.lastfmUsername;

		return true;
	}
}

export interface NukeMessage {
	channel: string;
	message: string;
	user: string;
	user_id: string;
	sentAt: number;
}

export class SimplifiedChannel {
	public login: string;
	public id: string;
	public isMod: boolean;
}

export type TwitchUserId = string;

export interface SelfRecentMessage {
	channel: string;
	message: string;
	time: number;
}

export interface ChannelRecentMessage {
	user: string;
	message: string;
	timestamp: number;
}

export type ChatroomMessage =
	| {
			type: 'user_moderation_action';
			data: {
				action: string;
				channel_id: string;
				target_id: string;
				expires_at?: string;
				expires_in_ms?: number;
				reason?: string;
			};
	  }
	| {
			type: 'channel_banned_alias_restriction_update';
			data: {
				user_is_restricted: boolean;
				ChannelID: string;
			};
	  };
