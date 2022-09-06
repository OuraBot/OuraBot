import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';
import { promises as fs } from 'fs-extra';

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

		const file = Event.data.file;

		const logs = await fs.readdir('../logs');
		const today = logs.filter((log) => log.includes(new Date().toISOString().split('T')[0]))[0];
		let log;
		try {
			log = await fs.readFile(`../logs/${file ? file : today}`, 'utf8');
		} catch (e) {
			log = 'no logs found';
		}

		resolve({
			...Event,
			status: StatusCodes.OK,
			data: {
				available: logs,
				log: log,
				today: today,
				this: file ? file : today,
			},
		});
	});
}
