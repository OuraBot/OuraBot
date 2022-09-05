import axios, { AxiosError, AxiosRequestConfig, AxiosRequestHeaders, AxiosResponseHeaders } from 'axios';
import ob from '../..';

export class API {
	async get<Type>(url: string, cache: number, options?: AxiosRequestConfig): Promise<APIReturn<Type>> {
		// instead of using ob's cache manager, we use this slightly modified version
		const cacheHash = ob.utils.generateMD5(url + (options ? JSON.stringify(options) : ''));
		const cacheData = await ob.redis.get(ob.config.redisPrefix + ':' + 'cache:api:' + cacheHash);

		ob.logger.info(`${cacheData ? ' CACHED' : ''}: ${url}`, 'ob.http');

		if (cacheData) {
			return {
				data: JSON.parse(cacheData) as APIReturnPartial<Type>,
				cached: true,
				invalidateCache: this.invalidateCache.bind(this, cacheHash),
			};
		}

		let response;
		try {
			response = await axios.get(url, options);
		} catch (err) {
			return {
				error: err,
				cached: false,
				data: null,
				invalidateCache: this.invalidateCache.bind(this, cacheHash),
			};
		}

		const returnData: APIReturnPartial<Type> = {
			response: {
				status: response.status,
				data: response.data,
				headers: response.headers ? response.headers : {},
			},
			request: {
				url: response.config.url,
				method: response.config.method as Method,
				options: options ? options : {},
			},
		};
		if (cache > 0) {
			await ob.redis.set(ob.config.redisPrefix + ':' + 'cache:api:' + cacheHash, JSON.stringify(returnData), 'EX', cache);
		}

		return {
			data: returnData,
			cached: false,
			invalidateCache: this.invalidateCache.bind(this, cacheHash),
		};
	}

	async post(url: string, data: object, options?: AxiosRequestConfig): Promise<APIReturnPartial<any>> {
		try {
			const response = await axios.post(url, data, options);
			return {
				response: {
					status: response.status,
					data: response.data,
					headers: response.headers ? response.headers : {},
				},
				request: {
					url: response.config.url,
					method: response.config.method as Method,
					options: options ? options : {},
				},
			};
		} catch (e) {
			return {
				response: {
					status: e.response.status,
					data: e.response.data,
					headers: e.response.headers ? e.response.headers : {},
				},
				request: {
					url: e.config.url,
					method: e.config.method as Method,
					options: options ? options : {},
				},
			};
		}
	}

	async gql<Type>(url: string, cache: number, query: string, variables?: object, headers?: AxiosRequestHeaders): Promise<APIReturn<Type>> {
		const cacheHash = ob.utils.generateMD5(url + query + (variables ? JSON.stringify(variables) : ''));
		const cacheData = await ob.redis.get(ob.config.redisPrefix + ':' + 'cache:api:' + cacheHash);

		ob.logger.info(`${cacheData ? ' CACHED' : ''}: ${url}`, 'ob.http');

		if (cacheData) {
			return {
				data: JSON.parse(cacheData) as APIReturnPartial<Type>,
				cached: true,
				invalidateCache: this.invalidateCache.bind(this, cacheHash),
			};
		}

		let response;
		try {
			response = await axios.post(
				url,
				{
					query,
					variables,
				},
				{
					headers: {
						...headers,
						'Content-Type': 'application/json',
					},
				}
			);
		} catch (err) {
			return {
				error: err,
				cached: false,
				data: null,
				invalidateCache: this.invalidateCache.bind(this, cacheHash),
			};
		}

		const returnData: APIReturnPartial<Type> = {
			response: {
				status: response.status,
				data: response.data,
				headers: response.headers ? response.headers : {},
			},
			request: {
				url: response.config.url,
				method: response.config.method as Method,
				options: response.config.data,
			},
		};
		if (cache > 0) {
			await ob.redis.set(ob.config.redisPrefix + ':' + 'cache:api:' + cacheHash, JSON.stringify(returnData), 'EX', cache);
		}

		return {
			data: returnData,
			cached: false,
			invalidateCache: this.invalidateCache.bind(this, cacheHash),
		};
	}

	private async invalidateCache(cacheHash: string): Promise<void> {
		await ob.redis.del(ob.config.redisPrefix + ':' + 'cache:api:' + cacheHash);
	}
}

export type APIReturnPartial<Type> = {
	response: {
		status: number;
		data: Type;
		headers: AxiosResponseHeaders;
	};
	request: {
		url: string;
		method: Method;
		options: AxiosRequestConfig;
	};
};

export type APIReturn<Type> = {
	data: APIReturnPartial<Type>;
	cached: boolean;
	invalidateCache: () => Promise<void>;
	error?: AxiosError;
};

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
