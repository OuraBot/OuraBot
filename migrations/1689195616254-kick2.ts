import getModels from '../Common/src/models';

export async function up() {
	const { Channel } = await getModels();

	await Channel.updateMany(
		{ kick: { $exists: false } },
		{
			$set: {
				kick: {
					slug: 'notlinked',
					id: 'notlinked',
					user_id: 'notlinked',
					streamer_id: 'notlinked',
					chatroom_id: 'notlinked',
					chatroom_channel_id: 'notlinked',
					secretConfirmed: false,
					linkedAt: null,
					verificationCode: 'notlinked',
					codeExpiresAt: null,
				},
			},
		}
	).exec();
}

export async function down() {
	const { Channel } = await getModels();

	await Channel.updateMany({ kick: { $exists: true } }, { $unset: { kick: 1 } }).exec();
}
