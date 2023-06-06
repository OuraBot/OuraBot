import { Prism } from '@mantine/prism';
import type { LoaderFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { forbidden, unauthorized } from 'remix-utils';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import type { IChannel } from '~/services/models/Channel';
import type { TwitchSession } from '~/services/oauth.strategy';
import { query } from '~/services/redis.server';

import React from 'react';
export const loader: LoaderFunction = async ({ params, request }) => {
	const session: TwitchSession = (
		await authenticator.isAuthenticated(request, {
			failureRedirect: '/login',
		})
	).json;

	const channel: IChannel | null = await ChannelModel.findOne({ id: session.id });

	if (!channel) throw unauthorized('Channel not found');

	if (channel.role !== 1) throw forbidden('Missing permissions');

	const admin = await query('QUERY', 'Admin', channel.token, session.id);

	if (admin.status !== 200) throw new Error(`QUERY Admin returned error code ${admin.status}`);

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
			{/* Embed https://grafana.mrauro.dev/d/b9786615-561c-47b1-93f4-390f8276db5b/ourabot?orgId=1 */}
			<iframe
				src="https://grafana.mrauro.dev/d/b9786615-561c-47b1-93f4-390f8276db5b/ourabot?orgId=1&refresh=5s&kiosk"
				width="100%"
				height="100%"
				title="Grafana Dashboard"
			></iframe>

			<Prism withLineNumbers language="json">
				{JSON.stringify(data.admin.data, null, 2)}
			</Prism>
		</>
	);
}
