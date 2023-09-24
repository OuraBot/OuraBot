import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import axios from 'axios';
import chalk from 'chalk';
import crypto, { randomUUID } from 'crypto';
import FormData from 'form-data';
import fs from 'fs';
import urlRegexSafe from 'url-regex-safe';
import ob from '..';
import { ChattersResponse, IvrFiSubage, IvrFiUser, LogsIvrFiChannels, SevenTVEmote, SevenTVRESTUserResponse, UnshortenMeResponse } from '../Typings/API';
import { Emote } from '../Typings/ThirdPartyEmotes';
import { Channel, Command, hasPermission, SimplifiedChannel, TwitchUserId } from '../Typings/Twitch';
import { CacheTimes } from './API/constants';
import { EnvironmentVariables } from './env';

export default class Utils {
	public ASCII_REGEX: RegExp =
		/([─│┌┐└┘├┤┬┴┼═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬╤╥▀▄█▌▐░▒▓■□▪▫▬▲►▼◄⠁⠂⠄⠈⠐⠠⡀⢀⠃⠅⠉⠑⠡⡁⢁⠆⠊⠒⠢⡂⢂⠌⠔⠤⡄⢄⠘⠨⡈⢈⠰⡐⢐⡠⢠⣀⠇⠋⠓⠣⡃⢃⠍⠕⠥⡅⢅⠙⠩⡉⢉⠱⡑⢑⡡⢡⣁⠎⠖⠦⡆⢆⠚⠪⡊⢊⠲⡒⢒⡢⢢⣂⠜⠬⡌⢌⠴⡔⢔⡤⢤⣄⠸⡘⢘⡨⢨⣈⡰⢰⣐⣠⠏⠗⠧⡇⢇⠛⠫⡋⢋⠳⡓⢓⡣⢣⣃⠝⠭⡍⢍⠵⡕⢕⡥⢥⣅⠹⡙⢙⡩⢩⣉⡱⢱⣑⣡⠞⠮⡎⢎⠶⡖⢖⡦⢦⣆⠺⡚⢚⡪⢪⣊⡲⢲⣒⣢⠼⡜⢜⡬⢬⣌⡴⢴⣔⣤⡸⢸⣘⣨⣰⠟⠯⡏⢏⠷⡗⢗⡧⢧⣇⠻⡛⢛⡫⢫⣋⡳⢳⣓⣣⠽⡝⢝⡭⢭⣍⡵⢵⣕⣥⡹⢹⣙⣩⣱⠾⡞⢞⡮⢮⣎⡶⢶⣖⣦⡺⢺⣚⣪⣲⡼⢼⣜⣬⣴⣸⠿⡟⢟⡯⢯⣏⡷⢷⣗⣧⡻⢻⣛⣫⣳⡽⢽⣝⣭⣵⣹⡾⢾⣞⣮⣶⣺⣼⡿⢿⣟⣯⣷⣻⣽⣾⣿⠀]{5,})/gim;

	// SHOULD MATCH
	// https://7tv.app/emotes/60e6ff484af5311ddcadae45
	// https://www.7tv.app/emotes/60e6ff484af5311ddcadae45
	// 60e6ff484af5311ddcadae45

	// SHOULDNT MATCH
	// asdkasdflasdfasdf
	// https://7tv.app/emotes/asdfasdfasdf
	// https://www.7tv.app/emotes/asdfasdfasdf
	// https://asdfasdfasdf.asdffasdfasdf/asdfasdf/asdf
	public SevenTVEmoteURLRegex: RegExp = /(https:\/\/(www)?\.?7tv\.app\/emotes\/)?([0-9abcdef]{24})/gim;

	// from https://github.com/SevenTV/ServerGo/blob/f8c12e1a918e16cb4df652c1cb3343f66c3b555f/src/validation/validation.go#L10
	public SevenTVEmoteRegex: RegExp = /^[-_A-Za-z():0-9]{2,100}$/;

	public TwitchUsernameRegex: RegExp = /^[a-zA-Z0-9_]{2,25}$/;
	public TwitchUserIdRegex: RegExp = /^[0-9]+$/;

	public ZeroWidthSpace: string = '\u{E0000}';

	public timeUnits = {
		y: { d: 365, h: 8760, m: 525600, s: 31536000, ms: 31536000.0e3 },
		d: { h: 24, m: 1440, s: 86400, ms: 86400.0e3 },
		h: { m: 60, s: 3600, ms: 3600.0e3 },
		m: { s: 60, ms: 60.0e3 },
		s: { ms: 1.0e3 },
	};

	chunkArr(arr: string[], len: number, joiner: string = ' '): string[] {
		return arr.reduce((acc, word, i) => {
			if (!i || acc[acc.length - 1].length + word.length >= len) {
				acc.push(word);
			} else {
				acc[acc.length - 1] += joiner + word;
			}
			return acc;
		}, []);
	}

	isSafeMessage(message: string): Boolean {
		let sanitizedMessage = this.removeAccents(this.removeBypassCharacters(message));
		if (sanitizedMessage.match(/(im|i\sam|i'm)\s(1|2|3|4|5|6|7|8|9)(1|2)/gi)) {
			return false;
		}

		if (sanitizedMessage.match(/((n|ñ|Ñ|ń|ņ|ň|ɲ|ŋ|ƞ|ǹ|ȵ|ɳ|ṉ|ṋ|ṅ|ṇ|\/\\\/|\|\\\|)[_\.\-\s]?[!1i|l][_\.\-\s]?[GgbB6934Q🅱qğĜƃ၅5]{2,3})(a|e|4)/gi)) {
			return false;
		}

		if (sanitizedMessage.match(/\bcrackers?/gi)) {
			return false;
		}

		if (sanitizedMessage.includes('blockedwordtest')) {
			return false;
		}

		return true;
	}

	formatMessage(message: string, noQuotations: boolean = false): string {
		// pajaDank
		return this.messageContainsAscii(this.isSafeMessage ? `${noQuotations ? '' : '"'}` + message + `${noQuotations ? '' : '"'}` : '<message withheld>')
			? '<ASCII Art>'
			: this.isSafeMessage
			? `${noQuotations ? '' : '"'}` + message + `${noQuotations ? '' : '"'}`
			: '<message withheld>';
	}

	removeAccents(str: string): string {
		return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	}

	removeBypassCharacters(str: string): string {
		return str.replace(/[\u200B-\u200D\uFEFF]/g, '');
	}

	messageContainsAscii(message: string): boolean {
		return message.match(this.ASCII_REGEX)?.length >= 4 ? true : false;
	}

	getKeysFromType<T>(type: T): string[] {
		return Object.keys(type);
	}

	private nanoStopwatches = new Map<string, bigint>();

	startNanoStopwatch(name: string): void {
		this.nanoStopwatches.set(name, process.hrtime.bigint());
	}

	/**
	 * @param name
	 * @returns {number} in milliseconds to the thousandth
	 */
	stopNanoStopwatch(name: string): number {
		const start = this.nanoStopwatches.get(name);
		if (!start) {
			throw new Error(`Stopwatch ${name} not started`);
		}
		this.nanoStopwatches.delete(name);
		return Number(process.hrtime.bigint() - start) / 1000000;
	}

	stopNanoStopwatchAndLog(name: string): void {
		const start = this.nanoStopwatches.get(name);
		if (!start) {
			throw new Error(`Stopwatch ${name} not started`);
		}
		this.nanoStopwatches.delete(name);
		ob.logger.info(`${name}: ${Number(process.hrtime.bigint() - start) / 1000000}ms`, 'ob.utils.stopwatch');
	}

	attemptStopNanoStopwatch(name: string): void {
		const start = this.nanoStopwatches.get(name);
		if (!start) {
			return;
		}
		this.nanoStopwatches.delete(name);
	}

	sanitizeName(user: string): string {
		return user.replace(/^(@|#)|,?$/, '');
	}

	/**
	 * Returns if the user is able to use the command, whether being on cooldown, ...
	 * @param user
	 * @param channel
	 * @param command
	 */
	canUseCommand(user: string, channel: Channel, command: Command, msg: TwitchPrivateMessage): Boolean {
		if (ob.blockedUsers.filter((blockedUser) => blockedUser.userId === msg.userInfo.userId).length > 0) {
			if (ob.blockedUsers.filter((blockedUser) => blockedUser.userId === msg.userInfo.userId)[0].commands.includes(command.name)) return false;
		}

		if (!ob.debug) {
			if (ob.cooldowns.userCooldowns.has(`${user}-${command.name}`)) {
				return false;
			} else {
				ob.cooldowns.userCooldowns.set(`${user}-${command.name}`, Date.now() + command.userCooldown * 1000);
				setTimeout(() => {
					ob.cooldowns.userCooldowns.delete(`${user}-${command.name}`);
				}, command.userCooldown * 1000);
			}

			if (ob.cooldowns.channelCooldowns.has(`${channel.id}-${command.name}`)) {
				return false;
			} else {
				ob.cooldowns.channelCooldowns.set(`${channel.id}-${command.name}`, Date.now() + command.channelCooldown * 1000);
				setTimeout(() => {
					ob.cooldowns.channelCooldowns.delete(`${channel.id}-${command.name}`);
				}, command.channelCooldown * 1000);
			}
		} else {
			ob.logger.info(`Ignored cooldown for ${user}-${command.name}`, 'ob.utils');
		}
		if (command.permissions) {
			if (!hasPermission(command.permissions, user, channel.channel, msg)) {
				return false;
			}
		}

		return true;
	}

	generateMD5(str: string): string {
		return crypto.createHash('md5').update(str).digest('hex');
	}

	/**
	 * Returns a humanized time
	 *
	 * @param {number} ms
	 * @param {('seconds' | 'minutes' | 'hours' | 'days' | 'auto')} [depth='auto']
	 * @return {*}  {string}
	 * @memberof Utils
	 */
	humanizeTime(ms: number, depth: 'seconds' | 'minutes' | 'hours' | 'days' | 'auto' = 'auto'): string {
		let days, hours, minutes, seconds, milliseconds;

		milliseconds = ms;
		seconds = Math.floor(milliseconds / 1000);
		milliseconds = milliseconds % 1000;
		minutes = Math.floor(seconds / 60);
		seconds = seconds % 60;
		hours = Math.floor(minutes / 60);
		minutes = minutes % 60;
		days = Math.floor(hours / 24);
		hours = hours % 24;

		let _ms = days == 0 && hours == 0 && minutes == 0 ? (seconds ? `.${milliseconds}` : '') : '';

		return ((days > 0 ? `${days}d ` : '') + (hours > 0 ? `${hours}h ` : '') + (minutes > 0 ? `${minutes}m ` : '') + (seconds > 0 ? `${seconds}${_ms}s ` : '')).trim();
	}

	dateTimeToDate(dateTime: string): Date {
		return new Date(dateTime.replace(' ', 'T'));
	}

	/**
	 * Returns a formatted string, specifying an amount of time delta from current date to provided date.
	 * @param {Date} target
	 * @param {boolean} [skipAffixes] if true, the affixes "in X hours" or "X hours ago" will be omitted
	 * @returns {string}
	 */
	timeDelta(target: Date, depth: 'seconds' | 'minutes' | 'hours' | 'days' | 'auto' = 'auto', skipAffixes: boolean = false): string {
		const now = Date.now();
		const epoch = target.getTime();
		const future = epoch > now;
		const delta = Math.abs(epoch - now);

		let humaniedTime = this.humanizeTime(delta, depth);
		if (!skipAffixes) {
			return `${future ? 'in ' : ''}${humaniedTime}${future ? '' : ' ago'}`;
		} else {
			return humaniedTime;
		}
	}

	SQLiteDateToDate(datetime: string): Date {
		// use this instead of just dateTimeToDate in case of
		// any timezone issues that will be solved in the future
		return this.dateTimeToDate(datetime);
	}

	stripInvisibleChars(str: string): string {
		return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '_');
	}

	async unshortenURL(url: string): Promise<string> {
		let unshortendData = await ob.api.get<UnshortenMeResponse>(`https://unshorten.me/json/${encodeURIComponent(url)}`, 86400 * 7);
		if (unshortendData.error) return url;

		return unshortendData.data.response.data ? unshortendData.data.response.data.resolved_url : url;
	}

	urlsFromString(str: string) {
		let urlRegex = urlRegexSafe({
			exact: false,
			localhost: false,
			ipv4: false,
			ipv6: false,
		});
		urlRegex.lastIndex = 0;
		let urls: string[] = [];
		let match;
		while ((match = urlRegex.exec(str)) !== null) {
			urls.push(match[0]);
		}
		return urls;
	}

	getAllEmotes(Channel: Channel): Promise<Emote[]> {
		return Promise.all([
			this.get7tvChannelEmotes(Channel.id),
			this.get7tvGlobalmotes(),
			// this.getFfzChannelEmotes(Channel.channel), ffz loves to bug xd
			// this.getFfzGlobalEmotes(),
			this.getBttvChannelEmotes(Channel.id),
			this.getBttvGlobalEmotes(),
		]).then((emotes: Emote[][]) => {
			let allEmotes: Emote[] = [].concat(...emotes);
			let sortedEmotes = allEmotes.sort((a, b) => {
				if (a.name < b.name) return -1;
				if (a.name > b.name) return 1;
				return 0;
			});

			return sortedEmotes.filter((emote) => {
				return emote !== undefined;
			});
		});
	}

	async resolveUserByUsername(login: string, ttl: number = 300): Promise<IvrFiUser> {
		if (!this.TwitchUsernameRegex.test(login)) return null;
		let user = await ob.api.get<IvrFiUser[]>(`https://api.ivr.fi/v2/twitch/user?login=${login}`, ttl);
		if (user.error) return null;
		return user.data.response.data[0];
	}

	async resolveUserById(id: string, ttl: number = 300): Promise<IvrFiUser> {
		if (!this.TwitchUserIdRegex.test(id)) return null;
		let user = await ob.api.get<IvrFiUser[]>(`https://api.ivr.fi/v2/twitch/user?id=${id}`, ttl);
		if (user.error) return null;
		return user.data.response.data[0];
	}

	async getSubage(login: string, channel: string): Promise<IvrFiSubage> {
		if (!this.TwitchUsernameRegex.test(login)) return null;
		if (!this.TwitchUsernameRegex.test(channel)) return null;
		let resp = await ob.api.get<IvrFiSubage>(`https://api.ivr.fi/v2/twitch/subage/${login}/${channel}`, 300);
		if (resp.error) return null;
		return resp.data.response.data;
	}

	obfuscateStr(str: string): string {
		return [...str].join(this.ZeroWidthSpace);
	}

	async getBestAvailableEmote(Channel: Channel, emoteOptions: string[], fallbackEmote: string): Promise<string> {
		let availableEmotes = await this.getAllEmotes(Channel);

		let availableEmote: string = null;

		for (let emote of emoteOptions) {
			if (!emote) continue;
			if (availableEmote) break;

			availableEmote = availableEmotes.find((availableEmote) => {
				return availableEmote.name === emote;
			}).name;
		}

		if (!availableEmote) availableEmote = fallbackEmote;

		return availableEmote;
	}

	async upload(text: string): Promise<string> {
		let uniqueStr = this.generateMD5(text);
		fs.writeFileSync(`./temp_${uniqueStr}.txt`, text);

		const form = new FormData();
		form.append('attachment', fs.createReadStream(`./temp_${uniqueStr}.txt`));
		const resp = await axios.post(EnvironmentVariables.HASTE_URL, form, {
			headers: {
				...form.getHeaders(),
				authorization: `${EnvironmentVariables.HASTE_KEY}`,
			},
		});

		fs.unlinkSync(`./temp_${uniqueStr}.txt`);
		return resp.data.url;
	}

	async isIvrFiLoggedChannel(channel: string): Promise<boolean> {
		let resp = await ob.api.get<LogsIvrFiChannels>(`https://logs.ivr.fi/channels`, 600);
		if (resp.error) return false;

		if (resp.data.response.data.channels.map((channel: { userID: string; name: any }) => channel.name).includes(channel)) return true;
		else return false;
	}

	async sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	channelFromMany(_channel: Channel | SimplifiedChannel | string): string {
		let channel;
		if (typeof _channel === 'string') {
			channel = _channel;
		} else if (_channel instanceof Channel) {
			channel = _channel.channel;
		} else if (_channel instanceof SimplifiedChannel) {
			channel = _channel.login;
		} else {
			throw new Error('Invalid channel type');
		}

		return channel;
	}

	// Left for backwards compatibility
	async smartObfuscate(_channel: Channel | SimplifiedChannel | string, user: string, author: string): Promise<string> {
		return user;
	}

	async getBanReason(user: string): Promise<string> {
		let banReason = await ob.CacheManager.cache(
			async () => {
				let reason;
				try {
					let resp = await axios.post(
						`https://gql.twitch.tv/gql`,
						{
							operationName: 'ChannelShell',
							extensions: {
								persistedQuery: {
									version: 1,
									sha256Hash: '580ab410bcd0c1ad194224957ae2241e5d252b2c5173d8e0cce9d32d5bb14efe',
								},
							},
							variables: {
								login: user,
							},
						},
						{
							headers: {
								'Content-Type': 'text/plain;charset=UTF-8',
								'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
							},
						}
					);

					reason = resp.data['data']['userOrError']['reason'];
				} catch (err) {
					reason = null;
				}
				return reason ? reason : null;
			},
			`ban_reason:${user}`,
			1000 * 60 * 30
		);

		return banReason;
	}

	async get7tvChannelEmotes(channel: string): Promise<Emote[]> {
		// TODO: migrate to v3 api when it arrives
		// Auro: no
		let resp = await ob.api.get<SevenTVEmote[]>(`https://api.7tv.app/v2/users/${channel}/emotes`, 3600);

		if (resp.error) {
			if (resp.error.code === '404') return [];
			ob.logger.warn(`Error getting 7tv emotes for ${channel}: ${resp.error}`, 'ob.utils');
			return [];
		}

		return resp.data.response.data.map((emote: SevenTVEmote) => ({
			provider: '7TV',
			id: emote.id,
			name: emote.name,
		}));
	}

	async invalidate7tvChannelEmotesCache(channel: string): Promise<void> {
		await ob.redis.del(ob.config.redisPrefix + ':' + 'cache:api:' + ob.utils.generateMD5(`https://api.7tv.app/v2/users/${channel}/emotes`));
	}

	async get7tvGlobalmotes(): Promise<Emote[]> {
		// TODO: migrate to v3 api when it arrives
		let resp = await ob.api.get<SevenTVEmote[]>(
			'https://api.7tv.app/v2/emotes/global',
			3600,
			{
				timeout: 5000,
			},
			true
		);

		if (resp.error) {
			ob.logger.warn(`Error getting 7tv global emotes: ${resp.error}`, 'ob.utils');
			return [];
		}

		return resp.data.response.data.map((emote: SevenTVEmote) => ({
			provider: '7TV',
			id: emote.id,
			name: emote.name,
		}));
	}

	async get7tvUserData(user: string): Promise<SevenTVRESTUserResponse> {
		// TODO: migrate to v3 api when it arrives
		let resp = await ob.api.get<SevenTVRESTUserResponse>(
			`https://api.7tv.app/v2/users/${user}`,
			3600,
			{
				timeout: 5000,
			},
			true
		);

		if (resp.error) {
			ob.logger.warn(`Error getting 7tv user data for ${user}: ${resp.error}`, 'ob.utils');
			return null;
		}

		return resp.data.response.data;
	}

	async getFfzChannelEmotes(channel: string): Promise<Emote[]> {
		return [];
		// try {
		//     let resp = await ob.api.get<any>(
		//         `https://api.frankerfacez.com/v1/room/${channel}`,
		//         3600,
		//         {
		//             timeout: 5000,
		//         },
		//         true
		//     );

		//     if (resp.error) {
		//         if (resp.error.code === "404") return [];
		//         ob.logger.warn(
		//             `Error getting ffz emotes for ${channel}: ${resp.error}`,
		//             "ob.utils"
		//         );
		//         return [];
		//     }

		//     let emotes: Emote[] = [];
		//     for (let set in resp.data.response.data.sets) {
		//         for (let emote of resp.data.response.data.sets[set].emoticons) {
		//             emotes.push({
		//                 provider: "FFZ",
		//                 id: emote.id,
		//                 name: emote.name,
		//             });
		//         }
		//     }

		//     return emotes;
		// } catch (e) {
		//     // bandaid solution while im on vacation
		//     return [];
		// }
	}

	async getFfzGlobalEmotes(): Promise<Emote[]> {
		return [];
		// try {
		//     let resp = await ob.api.get<any>(
		//         "https://api.frankerfacez.com/v1/set/global",
		//         3600,
		//         {
		//             timeout: 5000,
		//         },
		//         true
		//     );

		//     if (resp.error) {
		//         ob.logger.warn(
		//             `Error getting ffz global emotes: ${resp.error}`,
		//             "ob.utils"
		//         );
		//         return [];
		//     }

		//     let emotes: Emote[] = [];
		//     for (let set in resp.data.response.data.sets) {
		//         for (let emote of resp.data.response.data.sets[set].emoticons) {
		//             emotes.push({
		//                 provider: "FFZ",
		//                 id: emote.id,
		//                 name: emote.name,
		//             });
		//         }
		//     }

		//     return emotes;
		// } catch (e) {
		//     return [];
		// }
	}

	async getBttvChannelEmotes(channelId: string): Promise<Emote[]> {
		let resp = await ob.api.get<any>(
			`https://api.betterttv.net/3/cached/users/twitch/${channelId}`,
			3600,
			{
				timeout: 5000,
			},
			true
		);

		if (resp.error) {
			if (resp.error.code === '404') return [];
			ob.logger.warn(`Error getting bttv emotes for ${channelId}: ${resp.error}`, 'ob.utils');
			return [];
		}

		let emotes: Emote[] = [];
		for (let emote of resp.data.response.data['channelEmotes']) {
			emotes.push({
				provider: 'BTTV',
				id: emote.id,
				name: emote.code,
			});
		}
	}

	async getBttvGlobalEmotes(): Promise<Emote[]> {
		let resp = await ob.api.get<any>(
			'https://api.betterttv.net/3/cached/emotes/global',
			3600,
			{
				timeout: 5000,
			},
			true
		);

		if (resp.error) {
			ob.logger.warn(`Error getting bttv global emotes: ${resp.error}`, 'ob.utils');
			return [];
		}

		return resp.data.response.data.map((emote: { id: string; code: string }) => ({
			provider: 'BTTV',
			id: emote.id,
			name: emote.code,
		}));
	}

	enumToArray(enumType: any): string[] {
		let arr = Object.keys(enumType).map((key) => key.toString());
		return arr.slice(arr.length / 2);
	}

	keyInObject(key: string, obj: any): boolean {
		return Object.keys(obj).includes(key);
	}

	generateUUID(): string {
		return randomUUID();
	}
}
