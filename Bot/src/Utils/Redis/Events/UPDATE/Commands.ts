import ob from '../../../..';
import { CategoryEnum, Permission } from '../../../../Typings/Twitch';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		const channel = await ob.db.models.Channel.model.findOne({
			id: Event.userId,
		});

		const modifiedDefaultCommands: RecievedDefaultCommandOptions[] = Event.data?.modifiedDefaultCommands || [];

		modifiedDefaultCommands.forEach((command) => {
			const cmd = ob.commands.get(command.name);
			if (!cmd) return;

			// The default channel cooldown is the lowest the cooldown can go
			// we check for this on the frontend, midend (remix action), and backend
			if (command.modifiedChannelCooldown < cmd.channelCooldown) command.modifiedChannelCooldown = cmd.channelCooldown;
			if (command.modifiedUserCooldown < cmd.userCooldown) command.modifiedUserCooldown = cmd.userCooldown;

			if (!cmd?.modifiablePermissions && command?.modifiedPermissions?.length > 0) command.modifiedPermissions = [];

			// remove any permissions that are not in the Permission enum
			command.modifiedPermissions = command.modifiedPermissions.filter((permission) => {
				return Permission[permission as Permission] !== undefined;
			});

			if (channel.defaultCommandOptions.find((c) => c.name === command.name)) {
				const index = channel.defaultCommandOptions.findIndex((c) => c.name === command.name);
				channel.defaultCommandOptions[index] = {
					name: command.name,
					enabled: command.enabled,
					modifiedUserCooldown: command.modifiedUserCooldown,
					modifiedChannelCooldown: command.modifiedChannelCooldown,
					modifiedPermissions: command.modifiedPermissions,
					chatMode: command.chatMode,
				};
			} else {
				channel.defaultCommandOptions.push({
					name: command.name,
					enabled: command.enabled,
					modifiedUserCooldown: command.modifiedUserCooldown,
					modifiedChannelCooldown: command.modifiedChannelCooldown,
					modifiedPermissions: command.modifiedPermissions,
					chatMode: command.chatMode,
				});
			}
		});

		// https://stackoverflow.com/a/24619023
		channel.markModified('defaultCommandOptions');

		await channel.save();

		ob.CacheManager.clear(`${Event.userId}_channelInfo`);

		resolve({
			...Event,
			status: StatusCodes.OK,
		});
	});
}

interface RecievedDefaultCommandOptions {
	name: string;
	modifiedUserCooldown?: number;
	modifiedChannelCooldown?: number;
	modifiedPermissions?: string[];
	enabled?: boolean;
	chatMode?: 'online' | 'both' | 'offline';
}
