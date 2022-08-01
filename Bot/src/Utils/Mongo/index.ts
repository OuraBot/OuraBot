import { connect, Mongoose, Schema, model, Model } from 'mongoose';
import { promises as fs } from 'fs-extra';
import { EnvironmentVariables } from '../env';

import { ChannelModel, IChannel, ISusUser, SusUserModel } from 'common';

export class Database {
	connection: Mongoose;
	models: {
		Channel: {
			interface: typeof IChannel;
			model: Model<typeof IChannel>;
		};
		SuspiciousUser: {
			interface: typeof ISusUser;
			model: Model<typeof ISusUser>;
		};
	};

	async init() {
		console.log(EnvironmentVariables.MONGO_URI);
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
				interface: IChannel,
				model: ChannelModel,
			},
			SuspiciousUser: {
				interface: ISusUser,
				model: SusUserModel,
			},
		};
	}
}
