import ob from '..';
import EventSource from 'eventsource';
import chalk from 'chalk';
import { EmoteEventUpdate } from '../Typings/API';
import { TwitchUserId } from '../Typings/Twitch';

export class SevenTVEvents {
	public _channels: string[] = [];

	// each eventsource can only connect up to 100 channels
	private eventSources: EventSource[] = [];

	public async init() {
		ob.db.models.Channel.model.find({ emoteEvents: true }).then((channel) => {
			this.channels = channel.map((c) => c.login);
			this.updateSources();
		});
	}

	public set channels(v: string[]) {
		this._channels = v;
	}

	public get channels(): string[] {
		return this._channels;
	}

	public async addChannel(login: string) {
		this._channels.push(login);

		const channel = await ob.db.models.Channel.model.findOne({ login: login });
		if (!channel) return console.warn(chalk.yellow(`Channel ${login} not found in database.`));

		channel.emoteEvents = true;
		await channel.save();

		console.log(chalk.green('[7TV] Adding channel #' + login));
		ob.twitch.say(login, '7TV emote updates are now enabled');
		this.updateSources();
	}

	public async removeChannel(login: string) {
		this._channels = this._channels.filter((c) => c !== login);

		const channel = await ob.db.models.Channel.model.findOne({ login: login });
		if (!channel) return console.warn(chalk.yellow(`Channel ${login} not found in database.`));

		channel.emoteEvents = false;
		await channel.save();

		console.log(chalk.red('[7TV] Removing channel #' + login));
		ob.twitch.say(login, '7TV emote updates are now disabled');
		this.updateSources();
	}

	public isListenedChannel(channel: string): boolean {
		return this._channels.includes(channel);
	}

	public updateSources() {
		console.log(chalk.yellow('[7TV] Updating event sources'));

		let chunks: string[][] = this._channels.reduce((acc, cur, i) => {
			if (i % 100 === 0) {
				acc.push([cur]);
			} else {
				acc[acc.length - 1].push(cur);
			}
			return acc;
		}, []);

		// TODO: fix this
		// check if we actually need to update the sources
		// let totalChannels = chunks.reduce((acc, cur) => acc + cur.length, 0);
		// if (this.eventSources.length === totalChannels) {
		// 	console.log(chalk.yellow('[7TV] No need to update event sources'));
		// 	return;
		// }

		for (let source of this.eventSources) {
			source.close();
		}

		chunks.forEach((chunk) => {
			const source = new EventSource(`https://events.7tv.app/v1/channel-emotes?${chunk.map((c: string) => `channel=${c}`).join('&')}`);
			this.eventSources.push(source);
			this.bindEvents(source);
		});
	}

	private bindEvents(source: EventSource) {
		source.addEventListener('open', (msg) => {
			console.log(chalk.green('[7TV] EventSource opened'));
		});

		source.addEventListener('error', (msg) => {
			console.error('error', msg);
			// TODO: implement logger
			this.updateSources();
		});

		source.addEventListener('update', (msg) => {
			console.log('update', msg);
			let data = JSON.parse(msg.data) as EmoteEventUpdate;
			switch (data.action) {
				case 'ADD':
					ob.twitch.say(data.channel, `7TV emote has been added: ${data.name}`);
					break;

				case 'REMOVE':
					ob.twitch.say(data.channel, `7TV emote has been removed: ${data.name}`);
					break;

				case 'UPDATE':
					ob.twitch.say(data.channel, `7TV emote ${data.emote.name} has been aliased to ${data.name}`);
					break;
			}
		});
	}
}
