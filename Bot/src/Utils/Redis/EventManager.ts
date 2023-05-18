import EventEmitter from 'events';
import { promises as fs } from 'fs-extra';
import { verify } from 'jsonwebtoken';
import ob from '../..';
import { TwitchUserId } from '../../Typings/Twitch';
import { EnvironmentVariables } from '../env';
import { SimpleRateLimiter } from '../SimpleRateLimiter';

export enum StatusCodes {
	OK = 200,
	BadRequest = 400,
	Unauthorized = 401,
	Forbidden = 403,
	TooManyRequests = 429,
	InternalServerError = 500,
}

export type UUID = string;
export type JwtToken = string;

const topics = ['Commands', 'Settings', 'Join', 'Admin', 'Logs', 'Phrases'] as const;

type Topic = typeof topics[number];
type Operation = 'QUERY' | 'UPDATE' | 'RESPONSE';

export interface Event {
	operation?: Operation;
	topic: Topic;
	uuid: UUID;
	auth?: JwtToken;
	userId: TwitchUserId;
	status?: StatusCodes;
	sender?: 'SERVER' | 'CLIENT';
	data?: {
		[key: string]: any;
	};
}

export class EventManager {
	private redisChannel: string;
	private emitter = new EventEmitter();

	init() {
		this.redisChannel = ob.config.redisPrefix + 'events';

		ob.subRedis.subscribe(this.redisChannel);

		this.registerEvents();

		ob.subRedis.on('message', (channel, message) => {
			if (channel !== this.redisChannel) return;

			const event = this.parseEvent(message);

			// Check if we have a valid event, if not, silently drop it
			// There is no point in sending a message back if we aren't sure
			// that it has a UUID to listen for
			if (!event) {
				ob.logger.warn('invalid event recieved: ' + JSON.stringify({ ...message, auth: '[REDACTED]' }), 'ob.eventmanager');
				return;
			}

			// If the event was sent by the server, this app, don't do anything
			if (event.sender == 'SERVER') return;

			ob.logger.debug(`event recieved ${event.operation}ing ${event.topic} [${event.uuid}]`, 'ob.eventmanager');

			switch (event.operation) {
				case 'QUERY':
					this.emitter.emit('QUERY', event);
					break;

				case 'UPDATE':
					this.emitter.emit('UPDATE', event);
					break;

				case 'RESPONSE':
					this.emitter.emit('RESPONSE', event);
					break;

				default:
					ob.logger.warn('invalid event operation: ' + JSON.stringify({ ...event, auth: '[REDACTED]' }), 'ob.eventmanager');
					this.sendEvent({
						status: StatusCodes.BadRequest,
						...event,
					});
					break;
			}
		});
	}

	on(event: string, listener: (event: Event) => void) {
		this.emitter.on(event, listener);
	}

	registerEvents() {
		let QUERYHandlers = new Map<Topic, (event: Event) => Promise<Event>>();
		let UPDATEHandlers = new Map<Topic, (event: Event) => Promise<Event>>();

		(async () => {
			QUERYHandlers = new Map(
				(await fs.readdir('./src/Utils/Redis/Events/QUERY')).map((file) => {
					delete require.cache[require.resolve(`./Events/QUERY/${file.replace('.ts', '')}`)];
					const event = require(`./Events/QUERY/${file.replace('.ts', '')}`);
					return [file.replace('.ts', '') as Topic, event.default];
				})
			);
		})();

		(async () => {
			UPDATEHandlers = new Map(
				(await fs.readdir('./src/Utils/Redis/Events/UPDATE')).map((file) => {
					delete require.cache[require.resolve(`./Events/UPDATE/${file.replace('.ts', '')}`)];
					const event = require(`./Events/UPDATE/${file.replace('.ts', '')}`);
					return [file.replace('.ts', '') as Topic, event.default];
				})
			);
		})();

		this.emitter.on('QUERY', async (event: Event) => {
			if (!QUERYHandlers.has(event.topic)) return;

			const handler = QUERYHandlers.get(event.topic);

			// A handler should be present, but just in case
			if (!handler) {
				ob.logger.warn('missing handler for event: ' + JSON.stringify({ ...event, auth: '[REDACTED]' }), 'ob.eventmanager');
				return this.sendEvent({
					status: StatusCodes.InternalServerError,
					...event,
				});
			}

			if (ob.rateLimits.query.has(event.userId)) {
				if (!ob.rateLimits.query.get(event.userId).take()) {
					ob.logger.debug(`rate limit exceeded: ${event.operation} - ${event.userId}`, 'ob.eventmanager');
					return this.sendEvent({
						status: StatusCodes.TooManyRequests,
						...event,
					});
				}
			} else {
				ob.rateLimits.query.set(event.userId, new SimpleRateLimiter(50, 30));
			}

			let decodedId: TwitchUserId;

			try {
				const decoded = verify(event.auth, EnvironmentVariables.JWT_SECRET) as {
					id: TwitchUserId;
					iat: number;
				};

				decodedId = decoded.id;
			} catch (e) {
				return this.sendEvent({
					status: StatusCodes.Forbidden,
					...event,
				});
			}

			if (decodedId !== event.userId) {
				return this.sendEvent({
					status: StatusCodes.Forbidden,
					...event,
				});
			}

			try {
				handler(event).then((response) => {
					this.sendEvent(response);
				});
			} catch (e) {
				ob.logger.warn('error in handler for event: ' + JSON.stringify({ ...event, auth: null }) + ` - ${e}`, 'ob.eventmanager');
				this.sendEvent({
					status: StatusCodes.InternalServerError,
					...event,
				});
			}
		});

		this.emitter.on('UPDATE', async (event: Event) => {
			if (!UPDATEHandlers.has(event.topic)) return;

			const handler = UPDATEHandlers.get(event.topic);

			// A handler should be present, but just in case
			if (!handler) {
				ob.logger.warn('missing handler for event: ' + JSON.stringify({ ...event, auth: null }), 'ob.eventmanager');
				return this.sendEvent({
					status: StatusCodes.InternalServerError,
					...event,
				});
			}

			if (ob.rateLimits.update.has(event.userId)) {
				if (!ob.rateLimits.update.get(event.userId).take()) {
					ob.logger.debug(`rate limit exceeded: ${event.operation} - ${event.userId}`, 'ob.eventmanager');
					return this.sendEvent({
						status: StatusCodes.TooManyRequests,
						...event,
					});
				}
			} else {
				ob.rateLimits.update.set(event.userId, new SimpleRateLimiter(20, 30));
			}

			let decodedId: TwitchUserId;

			try {
				const decoded = verify(event.auth, EnvironmentVariables.JWT_SECRET) as {
					id: TwitchUserId;
					iat: number;
				};

				decodedId = decoded.id;
			} catch (e) {
				return this.sendEvent({
					status: StatusCodes.Forbidden,
					...event,
				});
			}

			if (decodedId !== event.userId) {
				return this.sendEvent({
					status: StatusCodes.Forbidden,
					...event,
				});
			}

			try {
				handler(event).then((response) => {
					this.sendEvent(response);
				});
			} catch (e) {
				ob.logger.warn('error in handler for event: ' + JSON.stringify({ ...event, auth: null }) + ` - ${e}`, 'ob.eventmanager');

				this.sendEvent({
					status: StatusCodes.InternalServerError,
					...event,
				});
			}
		});

		this.emitter.on('RESPONSE', async (event: Event) => {
			ob.logger.warn('RESPONE handling is not implemented yet', 'ob.eventmanager');
		});
	}

	sendEvent(event: Event) {
		const json = { ...event, sender: 'SERVER', operation: 'RESPONSE', auth: null } as Event;
		ob.pubRedis.publish(this.redisChannel, JSON.stringify(json));
	}

	private parseEvent(event: string): Event {
		let json = null;

		try {
			json = JSON.parse(event);
		} catch (e) {
			return null;
		}

		if (!json) return null;
		if (Object.keys(json).length === 0) return null;

		if (!this.isValidEvent(json)) return null;

		if (!this.isTopic(json.topic)) return null;

		return json as Event;
	}

	private isValidEvent(json: Object): boolean {
		// Since types aren't available in the runtime, we'll just check if the object has the correct keys
		if (
			!json.hasOwnProperty('operation') ||
			!json.hasOwnProperty('topic') ||
			!json.hasOwnProperty('uuid') ||
			!json.hasOwnProperty('auth') ||
			!json.hasOwnProperty('userId')
		) {
			return false;
		} else {
			return true;
		}
	}

	private isTopic(topic: string): topic is Topic {
		return topics.includes(topic as Topic);
	}
}
