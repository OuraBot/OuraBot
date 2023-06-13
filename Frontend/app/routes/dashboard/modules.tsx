import { Button, Card, Divider, Grid, Group, Switch, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Prism } from '@mantine/prism';
import { Form, useLoaderData } from '@remix-run/react';
import { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/server-runtime';
import { set } from 'mongoose';
import { useState } from 'react';
import { json } from 'remix-utils';
import { InfoCircle } from 'tabler-icons-react';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import { query } from '~/services/redis.server';

export async function loader({ request }: LoaderArgs) {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await ChannelModel.findOne({ id: session.json.id });

	return {
		session,
		channel,
	};
}

export const meta: MetaFunction = () => {
	return {
		title: 'Modules / OuraBot',
		description: 'Manage your modules',
	};
};

export async function action({ request }: ActionArgs) {
	console.log('Hit');

	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const channel = await ChannelModel.findOne({ id: session.json.id });

	const formData = await request.formData();

	console.log(formData.forEach((value, key) => console.log(`${key}: ${value}`)));

	const module = formData.get('module');
	const enabled = formData.get('enabled') === 'on' ? true : false;

	console.log({ module, enabled });

	switch (module) {
		case 'smartemoteonly':
			{
				const modules = await query('UPDATE', 'Modules', channel.token, session.json.id, {
					name: 'smartemoteonly',
					enabled: enabled,
				});
				console.log(modules);
			}
			break;
	}

	return null;
}

export default function Modules() {
	const { channel } = useLoaderData();

	return (
		<>
			<Grid>
				<CardSmartEmoteOnly enabled={channel.modules.smartemoteonly.enabled} />
			</Grid>
			<Prism withLineNumbers language="json">
				{JSON.stringify(channel, null, 2)}
			</Prism>
		</>
	);
}

function CardSmartEmoteOnly(props: { enabled: boolean }) {
	const [enabled, setEnabled] = useState(props.enabled);

	return (
		<Grid.Col md={6} lg={3}>
			<Form method="post">
				<Card shadow="sm" p="lg" radius="md" withBorder>
					<Group position="apart" mb="xs">
						<Title order={3}>Smart Emote Only</Title>
					</Group>

					<Text size="sm">Deletes all messages that are not first or third party emotes (FFZ, BTTV, and 7TV are supported).</Text>

					<div style={{ display: 'flex', alignItems: 'center' }}>
						<InfoCircle size={24} />
						<Text ml="sm" weight={800} my="sm" size="xs" color="dimmed">
							Your chat client should hide deleted messages when this is enabled.
						</Text>
					</div>

					<Divider />

					<input type="hidden" name="module" value="smartemoteonly" />

					<Switch name="enabled" id="enabled" my="md" label="Enabled" checked={enabled} onChange={(event) => setEnabled(event.currentTarget.checked)} />

					<Button type="submit" color="blue" fullWidth radius="md" disabled={enabled === props.enabled}>
						Save
					</Button>
				</Card>
			</Form>
		</Grid.Col>
	);
}
