import ob from '../../../..';
import { CategoryEnum, Permission } from '../../../../Typings/Twitch';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		const channel = await ob.db.models.Channel.model.findOne({
			id: Event.userId,
		});

		switch (Event.data.name) {
			case 'smartemoteonly':
				{
					const { enabled, timeout } = Event.data;
					channel.modules.smartemoteonly.enabled = enabled;
					channel.modules.smartemoteonly.timeout = timeout;

					channel.markModified('modules');
					await channel.save();

					ob.CacheManager.clear(`${Event.userId}_channelInfo`);

					resolve({
						...Event,
						status: StatusCodes.OK,
					});
				}
				break;
		}

		resolve(Event);
	});
}
