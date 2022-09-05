import chalk from 'chalk';
import Redis from 'ioredis';
import ob from '../..';

export class CacheManager {
	public async cache(callback: () => Promise<any>, key: string, ttl: number = 1000 * 60): Promise<any> {
		const cacheHash = ob.utils.generateMD5(key);
		const cacheData = await ob.redis.get(ob.config.redisPrefix + ':' + 'cache:' + cacheHash);

		if (cacheData) {
			return JSON.parse(cacheData);
		}

		ob.logger.info(`MISS: ${key}`, 'ob.cache');
		const data = await callback();
		await ob.redis.set(ob.config.redisPrefix + ':' + 'cache:' + cacheHash, JSON.stringify(data), 'EX', ttl);

		return data;
	}

	public async clear(key: string): Promise<void> {
		const cacheHash = ob.utils.generateMD5(key);
		await ob.redis.del(ob.config.redisPrefix + ':' + 'cache:' + cacheHash);
	}

	public async clearAll(): Promise<void> {
		const keys = await ob.redis.keys(ob.config.redisPrefix + ':' + 'cache:*');
		for (let key of keys) {
			await ob.redis.del(key);
		}
		ob.logger.info(`Cleared ${keys.length} keys`, 'ob.cache');
	}

	public async size(): Promise<number> {
		const keys = await ob.redis.keys(ob.config.redisPrefix + ':' + 'cache:*');
		return keys.length;
	}
}
