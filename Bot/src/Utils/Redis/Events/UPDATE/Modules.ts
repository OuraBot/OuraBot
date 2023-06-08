import ob from '../../../..';
import { CategoryEnum, Permission } from '../../../../Typings/Twitch';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		const channel = await ob.db.models.Channel.model.findOne({
			id: Event.userId,
		});

		console.log(Event.data);

		resolve(Event);
	});
}
