import { json, LoaderFunction, Response } from '@remix-run/node';
import { ChannelModel } from '~/services/models/Channel';
import { query } from '~/services/redis.server';

export const loader: LoaderFunction = async ({ params, request }) => {
	let file = params.file;
	if (!file) throw new Response('missing file', { status: 400 });
	file = file.replace(/\.\.\//g, '');

	const auth = request.headers.get('Authorization');
	if (!auth) throw new Response('missing auth', { status: 401 });

	const channel = await ChannelModel.findOne({ token: auth });

	if (!channel) throw new Response('channel not found', { status: 404 });

	if (channel.role !== 1) throw new Response('forbidden', { status: 403 });

	let logs = await query('QUERY', 'Logs', channel.token, channel.id, {
		file: params.file,
	});

	if (logs.status !== 200) throw new Response(`QUERY Logs returned error code ${logs.status}`, { status: logs.status });

	return {
		...logs.data,
	};
};
