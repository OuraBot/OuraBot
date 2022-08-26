import { json, LoaderFunction, Response } from '@remix-run/node';
import { ChannelModel } from '~/services/models/Channel';

export type UserResponse = {
	_id: string;
	login: string;
	id: string;
	role: string;
	managers: string[];
	prefix: string;
	profile_image_url: string;
	emoteEvents: boolean;
	lastfmUsername: string;
	createdAt: string;
	premium: {
		active: boolean;
	};
};

export const loader: LoaderFunction = async ({ params }) => {
	const login = params.login;
	if (!login) throw new Response('missing login', { status: 400 });

	const channel = await ChannelModel.findOne({ login });

	console.log(channel, login);

	if (!channel) throw new Response('channel not found', { status: 404 });

	const active = channel.premium.orders.some((order: any) => {
		return order.status === 'PAID' && order.expiresAt > new Date();
	});

	return {
		_id: channel._id,
		login: channel.login,
		id: channel.id,
		role: channel.role,
		managers: channel.managers,
		prefix: channel.prefix,
		profile_image_url: channel.profile_image_url,
		emoteEvents: channel.emoteEvents,
		lastfmUsername: channel.lastfmUsername,
		createdAt: channel.createdAt,
		premium: {
			active: active,
		},
	} as UserResponse;
};
