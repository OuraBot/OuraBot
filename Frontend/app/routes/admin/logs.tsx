import { Button, Checkbox, NativeSelect, Table } from '@mantine/core';
import { LoaderFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { IChannel } from '../../../../Common';
import { useState } from 'react';
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

	const file = params.file;

	const logs = await query('QUERY', 'Logs', channel.token, session.id, {
		file,
	});

	if (logs.status !== 200) throw new Error(`QUERY Logs returned error code ${logs.status}`);

	return {
		session,
		channel,
		logs,
	};
};

export default function Index() {
	const data = useLoaderData();
	const [value, setValue] = useState(data.logs.data.today);
	const [file, setFile] = useState(data.logs.data.log);

	return (
		<>
			<NativeSelect
				data={data.logs.data.available}
				value={value}
				onChange={(event) => {
					setValue(event.currentTarget.value);
				}}
			/>

			<Button
				onClick={() => {
					fetch(`/api/v3/logs/${value}`, {
						headers: {
							Authorization: data.channel.token,
						},
					}).then(async (res) => {
						let data = await res.json();
						setFile(data.log);
					});
				}}
				my="md"
			>
				Get log
			</Button>

			<Table verticalSpacing="xs" fontSize="xs">
				<thead>
					<tr>
						<th>Level</th>
						<th>Label</th>
						<th>Message</th>
						<th>Timestamp</th>
					</tr>
				</thead>
				<tbody>
					{file
						.split('\n')
						.map((_log: string) => {
							try {
								let log = JSON.parse(_log);
								return (
									<tr key={`${log.level}${log.label}${log.timestamp}_${Math.random()}`}>
										<td>{log.level}</td>
										<td>{log.label}</td>
										<td>{log.message}</td>
										<td>{log.timestamp}</td>
									</tr>
								);
							} catch (e) {
								return null;
							}
						})
						.reverse()}
				</tbody>
			</Table>
		</>
	);
}
