import { ApiClient } from '@twurple/api';
import { ChatClient } from '@twurple/chat';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import chalk from 'chalk';
import { promises as fs } from 'fs-extra';
import ob from '..';
import OuraBot from '../Client';
import { CacheTimes } from '../Utils/API/constants';
import { ChatClientEvents } from '../Utils/eventBinder';
import { DefaultCommandOption } from '../Utils/Mongo/mongoschemas/Channel';
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
	clients: ChatClient[];
	rateLimiter: RateLimiter;
	joinRateLimiter: RateLimiter;
	private lastIndex: number = 0;

	constructor(chatClient: ChatClient, apiClient: ApiClient, clients: ChatClient[]) {
		this.chatClient = chatClient;
		this.apiClient = apiClient;
		this.clients = clients;
		this.rateLimiter = new RateLimiter();
		this.joinRateLimiter = new RateLimiter();
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
		const readyClients = ob.twitch.clients.filter((client: ChatClient) => client.isConnected);
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
	execute: (ob: OuraBot, user: string, channel: Channel, message: string, msg: TwitchPrivateMessage) => void;
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

	if (requiredPermissions.length === 0) return true;

	return requiredPermissions.every((permission) => permissions.includes(permission));
}

export async function getCommands(): Promise<Map<string, Command>> {
	return new Map(
		(await fs.readdir('./src/Events/Commands')).map((file) => {
			delete require.cache[require.resolve(`../Events/Commands/${file.replace('.ts', '')}`)];
			const cmd = require(`../Events/Commands/${file.replace('.ts', '')}`);
			console.log(chalk.green(`Loaded command: ${cmd.cmd.name}`));
			return [cmd.cmd.name, cmd.cmd];
		})
	);
}

export async function getModules(): Promise<Map<string, Module>> {
	return new Map(
		(await fs.readdir('./src/Events/Modules')).map((file) => {
			delete require.cache[require.resolve(`../Events/Modules/${file.replace('.ts', '')}`)];
			const module = require(`../Events/Modules/${file.replace('.ts', '')}`);
			console.log(chalk.green(`Loaded module: ${module.module.name}`));
			return [module.module.name, module.module];
		})
	);
}

export class Channel {
	public channel: string;
	public id: string;
	public enabledModules: string[] = [];
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

	async getChatters(): Promise<string[]> {
		const response = await ob.api.get<TMIChatters>(`https://tmi.twitch.tv/group/user/${this.channel}/chatters`, CacheTimes.TMIChatters);

		if (response?.error) return [];

		const allChatters = response.data.response.data.chatters.broadcaster.concat(
			response.data.response.data.chatters.moderators,
			response.data.response.data.chatters.staff,
			response.data.response.data.chatters.admins,
			response.data.response.data.chatters.global_mods,
			response.data.response.data.chatters.viewers
		);
		return allChatters;
	}

	async fetchDatabaseData(): Promise<void> {
		const channelData = await ob.CacheManager.cache(
			async () => {
				const data = await ob.db.models.Channel.model.findOne({ id: this.id });
				return data;
			},
			`${this.id}_channelInfo`,
			CacheTimes.ChannelInfo
		);

		if (!channelData) return console.warn(chalk.yellow(`Channel ${this.channel} not found in database.`));

		this.prefix = channelData.prefix;
		this.mongoId = channelData._id;
		this.enabledModules = channelData.modules;
		this.emoteEvents = channelData.emoteEvents;
		this.defaultCommandOptions = channelData.defaultCommandOptions;
		this.clipUrl = channelData.clipUrl;
		this.lastfmUsername = channelData.lastfmUsername;
	}
}

export interface NukeMessage {
	channel: string;
	message: string;
	user: string;
	sentAt: number;
}

export class SimplifiedChannel {
	public login: string;
	public id: string;
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
