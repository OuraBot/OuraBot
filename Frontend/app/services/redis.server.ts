import redis, { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const channel = process.env.REDIS_CHANNEL || 'obv3:events';

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
export type TwitchUserId = string;

const topics = ['Commands', 'Settings', 'Join', 'Admin'] as const;

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

const globalAny: any = global;

let cached = globalAny.redis;

if (!cached) {
	cached = globalAny.redis = { pub: { conn: null, promise: null }, sub: { conn: null, promise: null } };
}

export async function redisConnect(): Promise<{ pub: redis; sub: redis }> {
	if (cached.pub.conn && cached.sub.conn) {
		return { pub: cached.pub.conn, sub: cached.sub.conn };
	}

	if (!cached.pub.promise) {
		cached.pub.promise = new Promise((resolve, reject) => {
			const pub = new redis();
			pub.on('error', (err) => {
				reject(err);
			});
			pub.on('ready', () => {
				resolve(pub);
			});
		});
	}

	if (!cached.sub.promise) {
		cached.sub.promise = new Promise((resolve, reject) => {
			const sub = new redis();
			sub.on('error', (err) => {
				reject(err);
			});
			sub.on('ready', () => {
				resolve(sub);
			});
		});
	}

	cached.pub.conn = await cached.pub.promise;
	cached.sub.conn = await cached.sub.promise;

	return { pub: cached.pub.conn, sub: cached.sub.conn };
}

// async function query(event: PubSubEvents, topic: PubSubTopics, data: any): Promise<any> {
// 	const { pub, sub } = await redisConnect();
// 	// uuid is used to differentiate between multiple requests
// 	const uuid = uuidv4();
// 	const message: OutgoingMessage = `${event} ${topic} ${uuid} ${JSON.stringify(data)}`;
// 	pub.publish(channel, message);
// 	const response = await new Promise((resolve, reject) => {
// 		sub.subscribe(channel);
// 		sub.on('message', (channel, message) => {
// 			const [event, topic, uuid, data] = message.split(' ');
// 			if (event === 'RESPONSE' && topic === topic && uuid === uuid) {
// 				sub.unsubscribe(channel);
// 				resolve(JSON.parse(data));
// 			}
// 		});
// 	});
// }

export async function query(operation: Operation, topic: Topic, auth: JwtToken, userId: TwitchUserId, data?: any): Promise<Event> {
	const { pub, sub } = await redisConnect();
	// uuid is used to differentiate between multiple requests
	const uuid = uuidv4();
	const message: Event = {
		operation,
		topic,
		uuid,
		auth,
		userId,
		data: data,
		sender: 'CLIENT',
	};

	pub.publish(channel, JSON.stringify(message));
	return new Promise((resolve, reject) => {
		function handleMessage(channel: string, message: string) {
			try {
				const event = JSON.parse(message) as Event;

				if (event.sender !== 'SERVER' || event.uuid !== uuid) return;

				sub.unsubscribe(channel);
				sub.removeListener('message', handleMessage);
				resolve(event);
			} catch (e) {
				console.error(e);
				reject(message);
			}
		}

		sub.subscribe(channel);
		sub.on('message', handleMessage);
	});
}
