import { Button, Group, Table, Text, TextInput } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
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

	let channels: any;
	for (const channel of admin.data?.ob.channels) {
		const channelData = await ChannelModel.findOne({ id: channel.id });
		console.log(channelData);

		if (channelData) {
			channels[channel.id] = channelData;
		} else {
			break;
		}
	}

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

	const datasets: any[] = [];
	const labels: string[] = [];

	const openModal = () =>
		openConfirmModal({
			title: 'Please confirm your action',
			children: <Text size="sm">This action is so important that you are required to confirm it with a modal. Please click one of these buttons to proceed.</Text>,
			labels: {
				confirm: 'Confirm',
				cancel: 'Close',
			},
		});

	type Metric = {
		// the epoch timestamp
		timestamp: number;
		// the amount of messages per second
		rate: number;
	};

	for (const [key, value] of Object.entries(data.admin.data.ob.metrics.messages.history)) {
		let metrics = value as Metric[];

		const data = metrics.map((metric: Metric) => {
			return {
				x: `${new Date(metric.timestamp).toTimeString().split(' ')[0]}`,
				y: metric.rate,
			};
		});

		datasets.push({
			label: key,
			data: data,
		});
	}

	console.log(datasets);

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
				<Table verticalSpacing="xs" fontSize="sm">
					<thead>
						<tr>
							<th>Channel</th>
							<th>ID</th>
							<th>Messages per minute</th>
							<th>Leave Channel</th>
						</tr>
					</thead>
					<tbody>
						{data.admin.data.ob.channels.map((channel: { id: string; login: string }) => (
							<tr key={channel.id}>
								<td>
									<Text variant="link" component="p" onClick={openModal}>
										{channel.login}{' '}
									</Text>
								</td>
								<td>
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
								</td>
								<td>{datasets[0].data[0].x}</td>
								<td>
									<TextInput name="channelLogin" hidden defaultValue={channel.login} />
									<Button color="gray" name="action" value="PART" type="submit">
										❌
									</Button>
								</td>
							</tr>
						))}
					</tbody>
				</Table>
			</Form>
		</div>
	);
}
