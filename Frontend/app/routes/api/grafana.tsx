import { json, LoaderFunction, Response } from '@remix-run/node';
import { notFound } from 'remix-utils';
import { ChannelModel } from '~/services/models/Channel';
import { query } from '~/services/redis.server';

export const loader: LoaderFunction = async ({ params, request }) => {
	const auth = request.headers.get('Authorization');

	if (!auth) return notFound({});

	if (auth !== 'xAO7p0Z+wSqBqbBUyoSSm0ewwijyJG8MM1sIHd7Y6Xc=') return notFound({});

	return json({});
};
