import getModels from '../Common/src/models';

export async function up() {
	const { Channel } = await getModels();

	await Channel.updateMany({ 'modules.xqclivekick': { $exists: false } }, { $set: { 'modules.xqclivekick': { enabled: false } } }).exec();
}

export async function down() {
	const { Channel } = await getModels();

	await Channel.updateMany({ 'modules.xqclivekick': { $exists: true } }, { $unset: { 'modules.xqclivekick': 1 } }).exec();
}
