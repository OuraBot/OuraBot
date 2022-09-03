import { Button, Group, Text, TextInput } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { Form, useLoaderData } from '@remix-run/react';
import type { ActionArgs, LoaderFunction } from '@remix-run/server-runtime';
import type { IChannel } from 'common';
import { forbidden, unauthorized } from 'remix-utils';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import type { TwitchSession } from '~/services/oauth.strategy';
import { query } from '~/services/redis.server';
import { sign } from '~/utils/jsonwebtoken.server';

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

export async function action({ request }: ActionArgs) {
	const session: TwitchSession = (
		await authenticator.isAuthenticated(request, {
			failureRedirect: '/login',
		})
	).json;
	const formData = await request.formData();
	const channelLogin = formData.get('channelLogin') as string;

	const token = sign({ id: session.id }, process.env.JWT_SECRET || 'secret');
	const action = formData.get('action');

	if (action === 'JOIN') {
		const channelId = await (await fetch(`https://api.ivr.fi/twitch/resolve/${channelLogin}`)).json();

		await query('UPDATE', 'Join', token, session.id, {
			login: channelLogin,
			id: channelId.id,
		});
	} else if (action === 'PART') {
		await query('UPDATE', 'Leave', token, session.id, {
			login: channelLogin,
		});
	}
	return null;
}

export default function ChannelsPage() {
	const data = useLoaderData<typeof loader>();
	console.log(data.admin.data.ob.channels);

	return (
		<div>
			<Form method="post">
				{/* JOIN channel, text input for channel name */}
				<Group>
					<p>Join Channel:</p>
					<TextInput name="channelLogin" placeholder="forsen" />
					<Button type="submit" name="action" value="JOIN">
						Join
					</Button>
				</Group>
			</Form>
			<Form method="post">
				<ul>
					{data.admin.data.ob.channels.map((channel: { id: string; login: string }) => (
						<li key={channel.id}>
							<Group grow>
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
								<TextInput name="channelLogin" hidden defaultValue={channel.login} />
								<Button color="gray" name="action" value="PART" type="submit">
									❌
								</Button>
							</Group>
							<br />
						</li>
					))}
				</ul>
			</Form>
		</div>
	);
}
