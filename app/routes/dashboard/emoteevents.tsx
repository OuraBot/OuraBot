import { Button, Space, Stack, Switch, Text } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useTransition } from '@remix-run/react';
import { useState } from 'react';
import { authenticator } from '~/services/auth.server';
import { _model as Channel } from '~/services/models/Channel';
import { query } from '~/services/redis.server';

export async function loader({ request }: LoaderArgs) {
	// used to simulate a slow loading process
	// await new Promise((resolve) => setTimeout(resolve, 1000));

	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await Channel.findOne({ id: session.json.id });

	const enabled = await query('QUERY', 'EmoteUpdates', channel.token, session.json.id);

	return json({
		session,
		channel,
		enabled,
	});
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();

	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const channel = await Channel.findOne({ id: session.json.id });

	const enabled = formData.get('enabled') === 'on' ? true : false;

	const change = await query('UPDATE', 'EmoteUpdates', channel.token, session.json.id, {
		enabled: enabled,
	});

	return change;
}

export default function EmoteEvents() {
	const data = useLoaderData<typeof loader>();
	const transition = useTransition();
	const [checked, setChecked] = useState(data.enabled.data?.enabled ?? false);
	const [showedNotification, setShowedNotification] = useState(false);
	const response = useActionData<typeof action>();

	if (response && response.status !== 200 && !showedNotification) {
		setShowedNotification(true);
		showNotification({
			id: 'error',
			color: 'red',
			title: 'Error',
			message: `Error while saving: ${response?.data?.message || 'Unknown error'}`,
		});
	}

	if (response && response.status == 200 && !showedNotification) {
		setShowedNotification(true);
		showNotification({
			id: 'success',
			color: 'green',
			title: 'Success',
			message: `${response.data?.message?.charAt(0).toUpperCase() + response.data?.message?.slice(1) || ''}`,
		});
	}

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
						id="enabled"
						checked={checked}
						onChange={(event) => {
							setChecked(event.currentTarget.checked);
						}}
					/>
					<Space h="xs" />
					<Button
						type="submit"
						disabled={checked === data.enabled.data?.enabled ?? false}
						loading={transition.state == 'submitting'}
					>
						Save
					</Button>
				</Form>
			</Stack>
		</>
	);
}
