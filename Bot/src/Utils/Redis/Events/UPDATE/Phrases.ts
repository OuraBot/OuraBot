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

		// const modifiedDefaultPhrases: RecievedDefaultPhraseOptions[] = Event.data?.modifiedDefaultPhrases || [];
	});
}

interface RecievedPhrase {
	name: string;
	response: {
		type: 'message';
		value: string;
		reply: boolean;
	};
	trigger: {
		value: string;
		regex: boolean;
	};
	cooldowns: {
		user: number;
		channel: number;
	};
}
