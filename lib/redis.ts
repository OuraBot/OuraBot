import Redis from 'ioredis';

export default class redis {
	connection: Redis.Redis;
	pubRedis: Redis.Redis;
	subRedis: Redis.Redis;

	constructor() {
		if (this.connection) {
			return this;
		} else {
			this.connection = new Redis();
			this.pubRedis = new Redis();
			this.subRedis = new Redis();
		}
	}

	async connect() {
		if (this.connection.status === 'ready') {
			return this;
		} else {
			await this.connection.connect();
			await this.pubRedis.connect();
			await this.subRedis.connect();
			return this;
		}
	}
}
