import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	ob.twitch.chatClient.join(Event.data.login);
	ob.twitch.say(Event.data.login, `MrDestructoid 👋`);

	return new Promise((resolve, reject) => {
		resolve({
			...Event,
			status: StatusCodes.OK,
		});
	});
}
