import getModels from '../Common/src/models';

export async function up() {
	const { Channel } = await getModels();

	await Channel.updateMany({ tos_version: { $exists: false } }, { $set: { tos_version: 0 } }).exec();
}

export async function down() {
	const { Channel } = await getModels();

	await Channel.updateMany({ tos_version: { $exists: true } }, { $unset: { tos_version: 0 } }).exec();
}
