import ob from '..';

export class ConnectedChecker {
	public interval: NodeJS.Timeout;

	constructor() {
		this.interval = setInterval(() => {
			if (!ob?.twitch?.chatClient) return; // It hasn't been initialized yet

			if (!ob.twitch.chatClient.isConnected) {
				ob.logger.warn('Twitch chat client disconnected, reconnecting...', 'ob.connectedChecker');
				ob.channels = [];
				ob.twitch.chatClient.reconnect();
			}
		}, 1000);
	}
}
