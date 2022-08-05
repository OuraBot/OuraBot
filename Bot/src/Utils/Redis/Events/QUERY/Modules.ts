import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		const channel = await ob.db.models.Channel.model.findOne({ id: Event.userId });

		const modules: {
			name: string;
			enabled: boolean;
			data: Map<string, any>;
		}[] = [];

		ob.modules.forEach((module) => {
			modules.push({
				name: module.name,
				enabled: false,
				data: new Map<string, any>(),
			});
		});

		channel.modules.forEach((module) => {
			const moduleData = modules.find((m) => m.name === module.name);
			modules.find((m) => m.name === module.name).enabled = moduleData.enabled;
			modules.find((m) => m.name === module.name).data = module.data;
		});

		resolve({
			...Event,
			status: StatusCodes.OK,
			data: {
				modules,
			},
		});
	});
}
