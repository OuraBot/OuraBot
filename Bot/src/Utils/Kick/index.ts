import Pusher from 'pusher-js';
import * as PusherTypes from 'pusher-js';
import ob from '../..';
import cycleTLS from 'cycletls';

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

export class KickController {
	async fetchChannel(channel: string): Promise<Channel | null> {
		const response = await ob.CacheManager.cache(
			async () => {
				const response = await ob.cycleTLS.get(`https://kick.com/api/v2/channels/${channel}`, {
					body: JSON.stringify({}),
					ja3: '771,4865-4867-4866-49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-51-57-47-53-10,0-23-65281-10-11-35-16-5-51-43-13-45-28-21,29-23-24-25-256-257,0',
					userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
				});

				if (response.status !== 200) {
					return null;
				} else {
					return { ...JSON.parse(JSON.stringify(response)), headers: null } ?? null;
				}
			},
			`kick_user_${channel}`,
			1000 * 60 * 5
		);

		if (!response || !response.body) {
			return null;
		} else {
			return response.body as Channel;
		}
	}
}

interface Channel {
	id: number;
	user_id: number;
	slug: string;
	is_banned: boolean;
	playback_url: string;
	vod_enabled?: boolean;
	subscription_enabled?: boolean;
	followers_count?: number;
	subscriber_badges: {
		id: number;
		channel_id: number;
		months: number;
		badge_image: {
			srcset: string;
			src: string;
		};
	}[];
	banner_image: {
		url: string;
	};
	livestream?: any; // Adjust the type if you have more information about the data
	role?: any; // Adjust the type if you have more information about the data
	muted: boolean;
	follower_badges: any[]; // Adjust the type if you have more information about the data
	offline_banner_image?: any; // Adjust the type if you have more information about the data
	verified: boolean;
	recent_categories: {
		id: number;
		category_id: number;
		name: string;
		slug: string;
		tags: string[];
		description?: string;
		deleted_at?: string;
		viewers: number;
		banner: {
			responsive: string;
			url: string;
		};
		category: {
			id: number;
			name: string;
			slug: string;
			icon: string;
		};
	}[];
	can_host: boolean;
	user: {
		id: number;
		username: string;
		agreed_to_terms: boolean;
		email_verified_at: string;
		bio: string;
		country?: string;
		state?: string;
		city?: string;
		instagram?: string;
		twitter?: string;
		youtube?: string;
		discord?: string;
		tiktok?: string;
		facebook?: string;
		profile_pic: string;
	};
	chatroom: {
		id: number;
		chatable_type: string;
		channel_id: number;
		created_at: string;
		updated_at: string;
		chat_mode_old: string;
		chat_mode: string;
		slow_mode: boolean;
		chatable_id: number;
		followers_mode: boolean;
		subscribers_mode: boolean;
		emotes_mode: boolean;
		message_interval: number;
		following_min_duration: number;
	};
}
