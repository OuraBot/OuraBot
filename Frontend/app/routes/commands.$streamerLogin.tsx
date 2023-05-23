import { Avatar, Button, Center, Container, Divider, Group, Table, Text, Title } from '@mantine/core';
import type { LoaderArgs } from '@remix-run/node';
import { fetch, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { ChannelModel } from '~/services/models/Channel';
import { query, redisConnect } from '~/services/redis.server';

type PublicChannel = {
	login: string;
	profile_image_url: string;
	id: string;
};

enum CategoryEnum {
	Utility = 'Utility',
	Fun = 'Fun',
	Moderation = 'Moderation',
}

export async function loader({ params }: LoaderArgs) {
	// Since this is a public facing endpoint that makes requests, we need to heavily cache the results.
	//

	let streamerLogin = params.streamerLogin?.toLowerCase()?.replace(/^(@|#)|,?$/, '');

	if (!streamerLogin) {
	} else {
		const { pub, sub } = await redisConnect();
		const cachedUser = await pub.get(`obfrontend:streamer:${streamerLogin}`);
		if (cachedUser) {
			console.log('Returning cached user data');
			return json(JSON.parse(cachedUser));
		} else {
			const channel = await ChannelModel.findOne({ login: streamerLogin });
			if (channel) {
				console.log('Channel found, returning data: ' + channel.login);
				const data: PublicChannel = {
					login: channel.login,
					profile_image_url: channel.profile_image_url,
					id: channel.id,
				};

				const commands = await query('QUERY', 'Commands', channel.token, channel.id);

				if (commands.status !== 200) throw new Error(`QUERY Commands returned error code ${commands.status}`);

				const returnData = {
					channel: data,
					commands: commands.data,
				};

				await pub.set(`obfrontend:commands:${streamerLogin}`, JSON.stringify(returnData), 'EX', 60 * 60 * 12); // 12 hours

				return json(returnData);
			} else {
				console.log('Channel not found');
				return json({ error: 'Channel not found' }, { status: 404 });
			}
		}
	}
}

export default function StreamerPage() {
	const { channel, commands } = useLoaderData();

	console.log(channel, commands);

	return (
		<Container mb="xl">
			{channel ? (
				<>
					<Group mt="xl" position="center" mb="sm">
						<Avatar src={channel.profile_image_url} alt={channel.login + "'s profile image."} size="lg" radius="xl" />
						<h1>{channel.login}'s Commands</h1>
					</Group>
					<Text mb="xl" align="center">
						Below are commands available in {channel.login}'s chat.
					</Text>

					<Title order={2}>Fun Commands</Title>
					<Table>
						<thead>
							<tr>
								<th>Command</th>
								<th>Description</th>
								<th>Usage</th>
								<th>Permission</th>
								<th>Enabled</th>
							</tr>
						</thead>
						<tbody>
							{commands.defaultCommands['Fun'].map((command: any) => (
								<tr key={command.name}>
									<td>{command.name}</td>
									<td>{command.description}</td>
									<td>{command.usage}</td>
									<td>{command.permissions.join(', ')}</td>
									<td>{command.enabled ? '✔' : '❌'}</td>
								</tr>
							))}
						</tbody>
					</Table>
					<Divider my="md" />

					<Title order={2}>Utility Commands</Title>
					<Table>
						<thead>
							<tr>
								<th>Command</th>
								<th>Description</th>
								<th>Usage</th>
								<th>Permission</th>
								<th>Enabled</th>
							</tr>
						</thead>
						<tbody>
							{commands.defaultCommands['Utility'].map((command: any) => (
								<tr key={command.name}>
									<td>{command.name}</td>
									<td>{command.description}</td>
									<td>{command.permissions.join(', ')}</td>
									<td>{command.usage}</td> <td>{command.enabled ? '✔' : '❌'}</td>
								</tr>
							))}
						</tbody>
					</Table>

					<Divider my="md" />

					<Title order={2}>Moderation Commands</Title>
					<Table>
						<thead>
							<tr>
								<th>Command</th>
								<th>Description</th>
								<th>Usage</th>
								<th>Permission</th>
								<th>Enabled</th>
							</tr>
						</thead>
						<tbody>
							{commands.defaultCommands['Moderation'].map((command: any) => (
								<tr key={command.name}>
									<td>{command.name}</td>
									<td>{command.description}</td>
									<td>{command.usage}</td>
									<td>{command.permissions.join(', ')}</td>
									<td>{command.enabled ? '✔' : '❌'}</td>
								</tr>
							))}
						</tbody>
					</Table>
				</>
			) : (
				<div
					style={{
						//   center div to middle of page
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
					}}
				>
					<Group>
						<h1>Channel data could not be found</h1>
					</Group>

					<Center>
						<Button component={Link} to="/" prefetch="intent">
							Go Home
						</Button>
					</Center>
				</div>
			)}
		</Container>
	);
}
