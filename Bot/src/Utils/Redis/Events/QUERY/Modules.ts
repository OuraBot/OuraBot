import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		const channel = await ob.db.models.Channel.model.findOne({
			id: Event.userId,
		});

		// TODO: Add premium checking

		const modules = channel.modules;

		const availableMethods: any[] = [];
		ob.modules.forEach((module) => {
			if (!module.hidden) availableMethods.push({ ...module, execute: null });
		});

		resolve({
			...Event,
			status: StatusCodes.OK,
			data: {
				modules: modules,
				availableMethods: availableMethods,
			},
		});
	});
}
