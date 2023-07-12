import getModels from '../Common/src/models';

export async function up() {
	const { Channel } = await getModels();

	await Channel.updateMany(
		{ kick: { $exists: false } },
		{
			$set: {
				kick: {
					slug: '',
					id: '',
					user_id: '',
					streamer_id: '',
					chatroom_id: '',
					chatroom_channel_id: '',
					secretConfirmed: false,
					linkedAt: null,
					verificationCode: '',
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
