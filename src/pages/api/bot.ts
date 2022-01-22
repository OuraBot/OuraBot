import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/dbConnect';
import Redis from '../../../lib/redis';
import * as Channel from '../../../mongoschemas/Channel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	// const { method } = req;
	// const { channelid } = req.query;
	// const { authorization } = req.headers;
	// if (!channelid) return res.status(400).json({ error: 'channelid is required' });
	// if (!authorization) return res.status(403).json({ error: 'authorization is required' });
	// await dbConnect();

	const redis = new Redis();

	// await redis.connection.publish('channelinfo', 'REQUEST 123');

	// wait for response
	// await redis.connection.subscribe('channelinfo');
	// redis.connection.on('message', (channel, message) => {
	// 	console.log(`Received message from channel ${channel}: ${message}`);
	// 	res.status(200).json({ message });
	// });

	// create a promise that resolves when the channelinfo channel receives a message
	// const promise = new Promise((resolve, reject) => {
	// 	redis.subRedis.subscribe('obv3:events');
	// 	let uuid = generateUUID();
	// 	let str = `REQUEST EmoteUpdates ${uuid} null`;
	// 	redis.pubRedis.publish('obv3:events', str);
	// 	redis.subRedis.on('message', (channel, message) => {
	// 		console.log(`Received message from channel ${channel}: ${message}`);
	// 		let _message = message.split(' ');
	// 		const type: PubSubEvents = _message[0] as PubSubEvents;
	// 		const topic: PubSubTopics = _message[1] as PubSubTopics;
	// 		const returnedUuid: string = _message[2];
	// 		const data: any = _message.slice(3).join(' ');

	// 		if (type === 'RESPONSE' && uuid === returnedUuid) {
	// 			redis.subRedis.unsubscribe('obv3:events');
	// 			console.log('resolving promise');
	// 			resolve(data);
	// 		}
	// 	});
	// });

	const { method } = req;

	switch (method) {
		case 'GET':
			{
				const promise = new Promise((resolve, reject) => {
					redis.subRedis.subscribe('obv3:events');
					let uuid = generateUUID();
					let str = `REQUEST EmoteUpdates ${uuid} null`;
					redis.pubRedis.publish('obv3:events', str);
					redis.subRedis.on('message', (channel, message) => {
						console.log(`Received message from channel ${channel}: ${message}`);
						let _message = message.split(' ');
						const type: PubSubEvents = _message[0] as PubSubEvents;
						const topic: PubSubTopics = _message[1] as PubSubTopics;
						const returnedUuid: string = _message[2];
						const data: any = _message.slice(3).join(' ');

						if (type === 'RESPONSE' && uuid === returnedUuid) {
							redis.subRedis.unsubscribe('obv3:events');
							resolve(data.split(','));
						}
					});
				});

				return res.status(200).json({ message: await promise });
			}
			break;

		case 'POST':
			{
				const { login } = req.query;
				const { authorization } = req.headers;
				// implement auth handling

				const promise = new Promise((resolve, reject) => {
					redis.subRedis.subscribe('obv3:events');
					let uuid = generateUUID();
					let str = `UPDATE EmoteUpdates ${uuid} ${login}`;
					redis.pubRedis.publish('obv3:events', str);
					redis.subRedis.on('message', (channel, message) => {
						console.log(`Received message from channel ${channel}: ${message}`);
						let _message = message.split(' ');
						const type: PubSubEvents = _message[0] as PubSubEvents;
						const topic: PubSubTopics = _message[1] as PubSubTopics;
						const returnedUuid: string = _message[2];
						const data: any = _message.slice(3).join(' ');

						if (type === 'RESPONSE' && uuid === returnedUuid) {
							redis.subRedis.unsubscribe('obv3:events');
							resolve(data);
						}
					});
				});

				return res.status(200).json({ message: await promise });
			}
			break;

		default:
			res.status(405).json({ error: 'method not allowed' });
	}

	// return res.status(200).json({ message: await promise });

	// if (method !== 'GET') return res.status(405);

	// const channels = await Channel._model.find();

	// const channelExists = channels.some((c) => c.id === channelid);

	// res.setHeader('Cache-Control', 'public, s-maxage=300');
	// res.status(200).json('channelExists');
}

type PubSubEvents = 'REQUEST' | 'UPDATE' | 'RESPONSE';
type PubSubTopics = 'EmoteUpdates';

function generateUUID() {
	// Public Domain/MIT
	var d = new Date().getTime(); //Timestamp
	var d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0; //Time in microseconds since page-load or 0 if unsupported
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16; //random number between 0 and 16
		if (d > 0) {
			//Use timestamp until depleted
			r = (d + r) % 16 | 0;
			d = Math.floor(d / 16);
		} else {
			//Use microseconds since page-load if supported
			r = (d2 + r) % 16 | 0;
			d2 = Math.floor(d2 / 16);
		}
		return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
	});
}
