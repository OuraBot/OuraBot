import getModels from '../Common/src/models';

export async function up() {
	const { Channel } = await getModels();

	await Channel.updateMany({ 'modules.livekick': { $exists: false } }, { $set: { 'modules.livekick': { enabled: false } } }).exec();
}

export async function down() {
	const { Channel } = await getModels();

	await Channel.updateMany({ 'modules.livekick': { $exists: true } }, { $unset: { 'modules.livekick': 1 } }).exec();
}
