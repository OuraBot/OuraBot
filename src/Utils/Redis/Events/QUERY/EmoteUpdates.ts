import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		const userResp = await ob.utils.resolveUserById(Event.userId);
		if (!userResp)
			resolve({
				...Event,
				status: StatusCodes.BadRequest,
				data: {
					message: 'userid not found',
				},
			});

		const userLogin = userResp.login;

		resolve({
			...Event,
			status: StatusCodes.OK,
			data: {
				enabled: ob.SevenTVEvents.isListenedChannel(userLogin),
			},
		});
	});
}
