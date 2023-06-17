import { Button, Card, Divider, Grid, Group, NumberInput, Switch, Text, Title } from '@mantine/core';
import { Form, useLoaderData } from '@remix-run/react';
import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/server-runtime';
import { useState } from 'react';
import { InfoCircle } from 'tabler-icons-react';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import { query } from '~/services/redis.server';
import { inBounds } from './commands';

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
	// const enabled = formData.get('enabled') === 'on' ? true : false;

	console.log({ module });

	switch (module) {
		case 'smartemoteonly':
			{
				const enabled = formData.get('enabledSEO') === 'on' ? true : false;

				const rawTimeout = formData.get('timeout');
				if (!rawTimeout) throw new Error('timeout is required');

				const timeout = parseInt(rawTimeout.toString());

				if (isNaN(timeout)) throw new Error('timeout must be a number');

				if (!inBounds(0, 3600, timeout)) throw new Error('timeout must be between 0 and 3600 seconds');

				const modules = await query('UPDATE', 'Modules', channel.token, session.json.id, {
					name: 'smartemoteonly',
					enabled: enabled,
					timeout: timeout,
				});
				console.log(modules);
			}
			break;

		case 'xqclivekick':
			{
				const enabled = formData.get('enabledXLK') === 'on' ? true : false;

				const modules = await query('UPDATE', 'Modules', channel.token, session.json.id, {
					name: 'xqclivekick',
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
				<CardSmartEmoteOnly enabled={channel.modules.smartemoteonly.enabled} timeout={channel.modules.smartemoteonly.timeout} />
				<CardxQcLiveKick enabled={channel.modules.xqclivekick.enabled} />
				<MoreComingSoon />
			</Grid>
			{/* <Prism withLineNumbers language="json">
				{JSON.stringify(channel, null, 2)}
			</Prism> */}
		</>
	);
}

function CardSmartEmoteOnly(props: { enabled: boolean; timeout: number }) {
	const [enabled, setEnabled] = useState(props.enabled);
	const [timeout, _setTimeout] = useState(props.timeout ?? 0);

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

					<Switch name="enabledSEO" id="enabledSEO" mt="md" label="Enabled" checked={enabled} onChange={(event) => setEnabled(event.currentTarget.checked)} />

					<NumberInput
						name="timeout"
						id="timeout"
						label="Timeout length (seconds)"
						description="How long to timeout users.  Use 0 to delete messages instead."
						min={0}
						max={3600}
						step={1}
						value={timeout}
						onChange={(val) => {
							_setTimeout(val ?? 0);
						}}
					/>

					<Button type="submit" color="blue" fullWidth mt="md" radius="md" disabled={enabled === props.enabled && timeout === props.timeout}>
						Save
					</Button>
				</Card>
			</Form>
		</Grid.Col>
	);
}

function CardxQcLiveKick(props: { enabled: boolean }) {
	const [enabled, setEnabled] = useState(props.enabled);

	return (
		<Grid.Col md={6} lg={3}>
			<Form method="post">
				<Card shadow="sm" p="lg" radius="md" withBorder>
					<Group position="apart" mb="xs">
						<Title order={3}>xQc Live on Kick</Title>
					</Group>

					<Text size="sm">
						Notifies your chat when xQc is live on{' '}
						<Text component="a" variant="link" href="https://kick.com" target="_blank">
							Kick
						</Text>
					</Text>

					<Divider mt="sm" />

					<input type="hidden" name="module" value="xqclivekick" />

					<Switch name="enabledXLK" id="enabledXLK" mt="md" label="Enabled" checked={enabled} onChange={(event) => setEnabled(event.currentTarget.checked)} />

					<Button type="submit" color="blue" fullWidth mt="md" radius="md" disabled={enabled === props.enabled}>
						Save
					</Button>
				</Card>
			</Form>
		</Grid.Col>
	);
}

function MoreComingSoon() {
	return (
		<Grid.Col md={6} lg={3}>
			<Card shadow="sm" p="lg" radius="md" withBorder>
				<Group position="apart" mb="xs">
					<Title order={3}>More coming soon!</Title>
				</Group>

				<Text size="sm">We're working on more modules for you to use. Check back soon!</Text>
				<Divider my="md" />
				<Text size="sm">
					Have a module idea? Suggest it{' '}
					<Text variant="link" component="a" href="/dashboard/suggest">
						here!
					</Text>{' '}
				</Text>
			</Card>
		</Grid.Col>
	);
}
