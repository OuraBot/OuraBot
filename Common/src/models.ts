import mongoose from 'mongoose';

import { ChannelSchema } from './mongoschemas/Channel';

const getModels = async () => {
	// In case you using mongoose 6
	// https://mongoosejs.com/docs/guide.html#strictQuery
	mongoose.set('strictQuery', false);

	// Ensure connection is open so we can run migrations
	await mongoose.connect(process.env.MIGRATE_MONGO_URI ?? '');

	// Make the model
	const Channel = mongoose.model('Channel', ChannelSchema);

	// Return models that will be used in migration methods
	return {
		mongoose,
		Channel,
	};
};

export default getModels;
