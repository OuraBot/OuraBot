import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		let channel = await ob.kick.fetchChannel(Event.data['username']);

		if (!channel) {
			resolve({
				...Event,
				status: StatusCodes.BadRequest,
				data: {
					channel: null,
				},
			});
		}

		await ob.kick.joinChannelTemporarily(`${channel.chatroom.id}`);

		resolve({
			...Event,
			status: StatusCodes.OK,
			data: {
				channel: channel,
			},
		});
	});
}
