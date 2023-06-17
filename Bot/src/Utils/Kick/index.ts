import Pusher from 'pusher-js';
import * as PusherTypes from 'pusher-js';
import ob from '../..';

export class PusherSubscriber {
	private pusher: Pusher;

	constructor() {
		this.pusher = new Pusher('eb1d5f283081a78b932c', {
			cluster: 'us2',
		});

		this.pusher.connection.bind('error', (err: any) => {
			ob.logger.warn(`Pusher error: ${err}`, 'ob.utils.pusher');
		});

		const xqc = this.pusher.subscribe('channel.668');

		// xqc.bind_global((event: any, data: any) => {
		// 	ob.logger.info(`${event}: ${JSON.stringify(data, null, 2)}`, `ob.utils.pusher`);
		// });

		xqc.bind('App\\Events\\StreamerIsLive', async (data: any) => this.streamerIsLive(data));
	}

	private async streamerIsLive(data: any) {
		ob.logger.info('xQc is live on Kick!', 'ob.utils.pusher');

		const channels = await ob.db.models.Channel.model.find({ 'modules.xqclivekick.enabled': true }).exec();
		ob.logger.info(`Found ${channels.length} channels with xqclivekick enabled`, 'ob.utils.pusher');

		for (let channel of channels) {
			ob.logger.info(`Sending message to ${channel.login}`, 'ob.utils.pusher');
			ob.twitch.say(channel.login, `BrainSlug xQc is now live on Kick! https://kick.com/xqc`);
		}
	}
}
