import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		const { enabled } = Event?.data;

		if (typeof enabled !== 'boolean')
			resolve({
				...Event,
				status: StatusCodes.BadRequest,
				data: {
					message: 'malformed enabled field',
				},
			});

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

		if (ob.SevenTVEvents.isListenedChannel(userLogin) && !enabled) {
			await ob.SevenTVEvents.removeChannel(userLogin);
			resolve({
				...Event,
				status: StatusCodes.OK,
				data: {
					message: 'no longer listening',
				},
			});
		}

		if (!ob.SevenTVEvents.isListenedChannel(userLogin) && enabled) {
			await ob.SevenTVEvents.addChannel(userLogin);
			resolve({
				...Event,
				status: StatusCodes.OK,
				data: {
					message: 'now listening',
				},
			});
		}

		resolve({
			...Event,
			status: StatusCodes.BadRequest,
			data: {
				message: `already ${enabled ? 'enabled' : 'disabled'}`,
			},
		});
	});
}
