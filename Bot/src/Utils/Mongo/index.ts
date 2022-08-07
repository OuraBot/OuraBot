import { connect, Mongoose, Schema, model, Model, models } from 'mongoose';
import { promises as fs } from 'fs-extra';
import { EnvironmentVariables } from '../env';

import { IChannel, ChannelSchema } from 'common';

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
			console.error(err);
			this.connection.connect(EnvironmentVariables.MONGO_URI);
		});

		this.connection.connection.on('disconnected', () => {
			console.error('MongoDB disconnected');
			this.connection.connect(EnvironmentVariables.MONGO_URI);
		});

		this.connection.connection.on('connected', () => {
			console.log('MongoDB connected');
		});

		const Str = Schema.Types.String as any;
		Str.checkRequired((v: string) => v != null);

		this.models = {
			Channel: {
				model: models['Channel'] || model<IChannel>('Channel', ChannelSchema),
			},
		};
	}
}
