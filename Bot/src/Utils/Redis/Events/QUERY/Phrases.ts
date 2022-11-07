import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';

export default async function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		resolve({
			...Event,
			status: StatusCodes.OK,
			data: {
				phrases: (await ob.db.models.Channel.model.findOne({ id: Event.userId })).phrases,
			},
		});
	});
}
