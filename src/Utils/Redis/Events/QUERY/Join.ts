import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	return new Promise((resolve, reject) => {
		resolve({
			...Event,
			status: StatusCodes.BadRequest,
		});
	});
}
