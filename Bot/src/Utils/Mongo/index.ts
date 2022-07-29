import { connect, Mongoose, Schema, model, Model } from 'mongoose';
import { promises as fs } from 'fs-extra';
import { EnvironmentVariables } from '../env';

import * as Channel from './mongoschemas/Channel';
import * as SuspiciousUser from './mongoschemas/SuspiciousUser';

export class Database {
	connection: Mongoose;
	models: {
		Channel: {
			interface: typeof Channel._interface;
			model: Model<typeof Channel._interface>;
		};
		SuspiciousUser: {
			interface: typeof SuspiciousUser._interface;
			model: Model<typeof SuspiciousUser._interface>;
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

		this.models = {
			Channel: {
				interface: Channel._interface,
				model: Channel._model,
			},
			SuspiciousUser: {
				interface: SuspiciousUser._interface,
				model: SuspiciousUser._model,
			},
		};
	}
}
