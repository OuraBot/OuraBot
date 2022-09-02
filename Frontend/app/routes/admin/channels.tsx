import { Text } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useLoaderData } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/server-runtime';
import type { IChannel } from 'common';
import { forbidden, unauthorized } from 'remix-utils';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import type { TwitchSession } from '~/services/oauth.strategy';
import { query } from '~/services/redis.server';

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

	return {
		session,
		channel,
		admin,
	};
};

export default function ChannelsPage() {
	const data = useLoaderData<typeof loader>();
	console.log(data.admin.data.ob.channels);

	return (
		<ul>
			{data.admin.data.ob.channels.map((channel: { id: string; login: string }) => (
				<li key={channel.id}>
					<Text variant="link" component="a" target="_blank" href={`https://twitch.tv/${channel.login}`}>
						{channel.login}{' '}
					</Text>
					<Text
						onClick={() => {
							navigator.clipboard.writeText(channel.id);
							showNotification({
								title: 'Copied!',
								message: `Copied ${channel.login}'s ID to clipboard`,
							});
						}}
						variant="text"
					>
						(ID: {channel.id}) 📋
					</Text>
				</li>
			))}
		</ul>
	);
}
