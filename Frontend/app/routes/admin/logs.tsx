import { NativeSelect, Button, Group, Grid, Paper, Container } from '@mantine/core';
import { Prism } from '@mantine/prism';
import { LoaderFunction, redirect } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import type { IChannel } from 'common';
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
				mb="sm"
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
			>
				Get log
			</Button>
			<p>{file}</p>
		</>
	);
}
