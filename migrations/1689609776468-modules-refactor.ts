import getModels from '../Common/src/models';

export async function up() {
	const { Channel } = await getModels();

	// Not modules refactor - put the wrong name

	// New module field (module.links). Should be this:
	// { enabled: false, timeout: 0, allowList: [], blockList: [], excludedPermissions: [], chatMode: 'both' },

	await Channel.updateMany(
		{ 'modules.links': { $exists: false } },
		{ $set: { 'modules.links': { enabled: false, timeout: 0, /* allowList: [], blockList: [], excludedPermissions: [], */ chatMode: 'both' } } }
	).exec();
}

export async function down() {
	const { Channel } = await getModels();

	await Channel.updateMany({ 'modules.links': { $exists: true } }, { $unset: { 'modules.links': 1 } }).exec();
}
