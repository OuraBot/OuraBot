import { connect, Mongoose, Schema, model, Model, models } from 'mongoose';
import { promises as fs } from 'fs-extra';
import { EnvironmentVariables } from '../env';

import { IChannel, ChannelSchema } from 'common';
import ob from '../..';

export class Database {
	connection: Mongoose;
	models: {
		Channel: {
			model: Model<IChannel>;
		};
	};

	async init() {
		this.connection = await connect(EnvironmentVariables.MONGO_URI);
		this.connection.connection.on('error', (err) => {
			ob.logger.fatal(`MongoDB connection error: ${err}`, 'ob.mongo');
			this.connection.connect(EnvironmentVariables.MONGO_URI);
		});

		this.connection.connection.on('disconnected', () => {
			ob.logger.warn('MongoDB disconnected', 'ob.mongo');
			this.connection.connect(EnvironmentVariables.MONGO_URI);
		});

		this.connection.connection.on('connected', () => {
			ob.logger.info('MongoDB connected', 'ob.mongo');
		});

		const Str = Schema.Types.String as any;
		Str.checkRequired((v: string) => v != null);

		this.models = {
			Channel: {
				model: models['Channel'] || model<IChannel>('Channel', ChannelSchema),
			},
		};

		setInterval(() => {
			try {
				ob.db.connection.connection.db.admin().ping();
			} catch (e) {
				ob.logger.warn('MongoDB ping failed', 'ob.mongo');
				ob.db.connection.connect(EnvironmentVariables.MONGO_URI);
			}
		}, 1000 * 60);
	}
}
