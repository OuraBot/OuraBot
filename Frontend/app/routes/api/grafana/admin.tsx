import { json, LoaderFunction, Response } from '@remix-run/node';
import { notFound } from 'remix-utils';
import { ChannelModel } from '~/services/models/Channel';
import { query } from '~/services/redis.server';

export const loader: LoaderFunction = async ({ params, request }) => {
	const auth = request.headers.get('Authorization');

	if (!auth) return notFound({});

	if (auth !== 'xAO7p0Z+wSqBqbBUyoSSm0ewwijyJG8MM1sIHd7Y6Xc=') return notFound({});

	const channel = await ChannelModel.findOne({ token: auth });

	if (!channel) throw new Response('channel not found', { status: 404 });

	if (channel.role !== 1) throw new Response('forbidden', { status: 403 });
	const admin = await query('QUERY', 'Admin', channel.token, channel.id);

	if (admin.status !== 200) throw new Error(`QUERY Admin returned error code ${admin.status}`);

	return json(admin);
};
