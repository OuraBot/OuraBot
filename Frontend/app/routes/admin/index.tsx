import { Prism } from '@mantine/prism';
import { LoaderFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { forbidden, unauthorized } from 'remix-utils';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import type { _IChannel } from '~/services/models/Channel';
import { TwitchSession } from '~/services/oauth.strategy';
import { query } from '~/services/redis.server';

export const loader: LoaderFunction = async ({ params, request }) => {
	const session: TwitchSession = (
		await authenticator.isAuthenticated(request, {
			failureRedirect: '/login',
		})
	).json;

	const channel: _IChannel | null = await ChannelModel.findOne({ id: session.id });

	if (!channel) throw unauthorized('Channel not found');

	if (channel.role !== 1) throw forbidden('Missing permissions');

	const admin = await query('QUERY', 'Admin', channel.token, session.id);

	return {
		session,
		channel,
		admin,
	};
};

export default function Index() {
	const data = useLoaderData<typeof loader>();

	return (
		<>
			<p>Admin Overview</p>
			<Prism withLineNumbers language="json">
				{JSON.stringify(data.admin.data, null, 2)}
			</Prism>
		</>
	);
}
