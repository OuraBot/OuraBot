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

			case 'xqclivekick':
				{
					const { enabled } = Event.data;
					channel.modules.xqclivekick.enabled = enabled;

					channel.markModified('modules');
					await channel.save();

					// We don't clear the cache here because xqclivekick doesn't connect with any messages

					resolve({
						...Event,
						status: StatusCodes.OK,
					});
				}
				break;

			case 'links':
				{
					const { enabled, timeout, chatMode } = Event.data;

					channel.modules.links.enabled = enabled;
					channel.modules.links.timeout = timeout;
					channel.modules.links.chatMode = chatMode;

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

		resolve({ ...Event, status: StatusCodes.BadRequest });
	});
}
