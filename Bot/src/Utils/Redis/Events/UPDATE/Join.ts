import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	ob.twitch.chatClient.join(Event.data.login);
	ob.twitch.say(Event.data.login, `MrDestructoid 👋`);

	const channel = ob.channels.find((c) => c.login === Event.data.login);
	if (!channel) {
		ob.channels.push({
			id: Event.data.id,
			login: Event.data.login,
			isMod: false,
		});
	}

	return new Promise((resolve, reject) => {
		resolve({
			...Event,
			status: StatusCodes.OK,
		});
	});
}
