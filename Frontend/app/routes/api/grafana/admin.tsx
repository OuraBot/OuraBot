import { json, LoaderFunction, Response } from '@remix-run/node';
import { notFound } from 'remix-utils';
import { ChannelModel } from '~/services/models/Channel';
import { query } from '~/services/redis.server';

export const loader: LoaderFunction = async ({ params, request }) => {
	const auth = request.headers.get('Authorization');

	if (!auth) return notFound({});

	if (auth !== 'xAO7p0Z+wSqBqbBUyoSSm0ewwijyJG8MM1sIHd7Y6Xc=') return notFound({});

	const channel = await ChannelModel.findOne({ login: 'auror6s' });

	if (!channel) throw new Response('channel not found', { status: 404 });

	if (channel.role !== 1) throw new Response('forbidden', { status: 403 });
	const prom = await query('QUERY', 'Prometheus', channel.token, channel.id);

	if (prom.status !== 200) throw new Error(`QUERY Prometheus returned error code ${prom.status}`);

	console.log(prom.data);
	const promData = prom?.data?.prom;
	if (!promData) throw new Error('no prom data');
	const data = promData.replace(/\\n/g, '\n');

	return new Response(data, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
};
