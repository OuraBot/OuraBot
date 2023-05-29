import { register } from 'prom-client';
import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';

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

		const prom = await register.metrics();

		resolve({
			...Event,
			status: StatusCodes.OK,
			data: {
				prom,
			},
		});
	});
}
