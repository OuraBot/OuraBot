import { Button, Space, Stack, Switch, Text } from '@mantine/core';
import { useState } from 'react';
import { ActionFunction, LoaderFunction } from '@remix-run/node';
import { Form, useLoaderData, useTransition } from '@remix-run/react';
import { authenticator } from '~/services/auth.server';
import { _model as Channel } from '~/services/models/Channel';
import { query } from '~/services/redis.server';

export let loader: LoaderFunction = async ({ request }) => {
	// used to simulate a slow loading process
	// await new Promise((resolve) => setTimeout(resolve, 1000));

	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await Channel.findOne({ id: session.json.id });

	const enabled = await query('QUERY', 'EmoteUpdates', channel.token, session.json.id);

	return {
		session,
		channel,
		enabled,
	};
};

export const action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();

	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const channel = await Channel.findOne({ id: session.json.id });

	const change = await query('UPDATE', 'EmoteUpdates', channel.token, session.json.id, {
		enabled: formData.get('enabled'),
	});

	return change;
};

export default function EmoteEvents() {
	const data = useLoaderData();
	const transition = useTransition();
	const [checked, setChecked] = useState(data.enabled.data['enabled']);

	return (
		<>
			<Stack>
				<Text>
					When Emote Updates are enabled, anytime a{' '}
					<Text variant="link" component="a" href="https://7tv.app" target="_blank">
						SevenTV
					</Text>{' '}
					emote is modified for the channel, it will be posted to chat.
				</Text>
				<Form method="post">
					<Switch
						label="Emote Events"
						name="enabled"
						checked={checked}
						onChange={(event) => {
							setChecked(event.currentTarget.checked);
						}}
					/>
					<Space h="xs" />
					<Button
						type="submit"
						disabled={checked === data.enabled.data['enabled']}
						loading={transition.state == 'submitting'}
					>
						Save
					</Button>
				</Form>
			</Stack>
		</>
	);
}
