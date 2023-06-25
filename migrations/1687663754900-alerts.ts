import getModels from '../Common/src/models';

export async function up() {
	const { Channel } = await getModels();

	await Channel.updateMany({ alerts: { $exists: false } }, { $set: { alerts: [] } }).exec();
}

export async function down() {
	const { Channel } = await getModels();

	await Channel.updateMany({ alerts: { $exists: true } }, { $unset: { alerts: 1 } }).exec();
}
