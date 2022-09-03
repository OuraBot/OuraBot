import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	ob.twitch.say(Event.data.login, `MrDestructoid 👋 Bye!`);
	ob.twitch.chatClient.part(Event.data.login);
	// remove channel from the ob.channels list
	ob.channels = ob.channels.filter((channel) => channel.login !== Event.data.login);
	console.log(ob.channels);

	return new Promise((resolve, reject) => {
		resolve({
			...Event,
			status: StatusCodes.OK,
		});
	});
}
