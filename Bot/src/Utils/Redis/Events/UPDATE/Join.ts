import ob from '../../../..';
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		const channel = await ob.db.models.Channel.model.findOne({
			id: Event.userId,
		});

		ob.twitch.chatClient.join(Event.data.login);
		ob.twitch.say(Event.data.login, `MrDestructoid 👋 @${Event.data.login} please give me moderator permissions with '/mod @oura_bot'`);

		try {
			const channel = ob.channels.find((c) => c.login === Event.data.login);
			if (!channel) {
				ob.channels.push({
					id: Event.userId,
					login: Event.data.login,
					isMod: false,
				});

				ob.twitch.pubsubClient.onModAction(ob.config.twitch_id, Event.userId, (data) => {
					ob.logger.debug(`Received mod action for ${Event.data.login}: ${data.type}`, 'ob.eventmanager.update.join');

					switch (data.type) {
						case 'moderator_added':
							{
								ob.channels.find((c) => c.id === Event.userId).isMod = true;
								ob.twitch.say(Event.data.login, `I am now moderator; all commands are now available!`);
							}
							break;
						case 'moderator_removed':
							{
								ob.channels.find((c) => c.id === Event.userId).isMod = false;
								ob.twitch.say(Event.data.login, `I am no longer moderator; bot functionality is now limited.`);
							}
							break;
					}
				});
			}
		} catch (err) {
			ob.logger.warn(`Failed to join channel for the first time: ${err}`, `ob.eventmanager.update.join`);
			channel.alerts.push('Failed to join channel. Please unban the bot with /unban oura_bot');

			resolve({
				...Event,
				status: StatusCodes.BadRequest,
			});
		}

		resolve({
			...Event,
			status: StatusCodes.OK,
		});
	});
}
