import getModels from '../Common/src/models';

export async function up() {
	const { Channel } = await getModels();

	await Channel.updateMany(
		{ kick: { $exists: false } },
		{
			$set: {
				kick: {
					slug: null,
					id: null,
					user_id: null,
					streamer_id: null,
					chatroom_id: null,
					chatroom_channel_id: null,
					secretConfirmed: false,
					linkedAt: null,
					verificationCode: null,
				},
			},
		}
	).exec();
}

export async function down() {
	const { Channel } = await getModels();

	await Channel.updateMany({ kick: { $exists: true } }, { $unset: { kick: 1 } }).exec();
}
