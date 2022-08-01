import ob from '../../../..';
import { CategoryEnum } from '../../../../Typings/Twitch';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		const channel = await ob.db.models.Channel.model.findOne({ id: Event.userId });

		const defaultCommands: {
			[key in CategoryEnum]?: {
				enabled: boolean;

				chatMode: 'online' | 'both' | 'offline';
				name: string;
				description: string;
				usage: string;
				userCooldown: number;
				channelCooldown: number;
				permissions: string[];
				modifiablePermissions: boolean;
				minimumUserCooldown: number;
				minimumChannelCooldown: number;
			}[];
		} = {};

		ob.commands.forEach((command) => {
			if (!defaultCommands[command.category]) defaultCommands[command.category] = [];

			const options = channel.defaultCommandOptions.find((cmd) => cmd.name === command.name);

			let permissions: string[] = [];
			if (command?.permissions) {
				if (command.permissions.length > 0) {
					permissions = command.permissions;
				} else {
					permissions = [];
				}
			}

			if (options?.modifiedPermissions) permissions = options.modifiedPermissions;

			if (command.hidden) return;

			defaultCommands[command.category].push({
				name: command.name,
				description: command.description,
				usage: command.usage,
				userCooldown: options?.modifiedUserCooldown ?? command.userCooldown,
				channelCooldown: options?.modifiedChannelCooldown ?? command.channelCooldown,
				minimumUserCooldown: command.userCooldown,
				minimumChannelCooldown: command.channelCooldown,
				modifiablePermissions: command.modifiablePermissions ?? false,
				permissions: permissions,
				enabled: options?.enabled ?? true,
				chatMode: options?.chatMode ?? 'both',
			});
		});

		resolve({
			...Event,
			status: StatusCodes.OK,
			data: {
				defaultCommands,
				customCommands: {},
			},
		});
	});
}
