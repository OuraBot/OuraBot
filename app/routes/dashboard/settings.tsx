import { Button, Container, Space, Stack, Switch, Text, TextInput } from '@mantine/core';
import { useState } from 'react';
import { ActionFunction, LoaderFunction } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useTransition } from '@remix-run/react';
import { authenticator } from '~/services/auth.server';
import { _model as Channel } from '~/services/models/Channel';
import { showNotification } from '@mantine/notifications';
import { Event, query } from '~/services/redis.server';

const PREFIX_REGEX = /^[a-zA-Z0-9!@#%^&*()-=_+;:'"<>,./?`~]{1,5}$/;

export const loader: LoaderFunction = async ({ request }) => {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await Channel.findOne({ id: session.json.id });

	const prefix = await query('QUERY', 'Prefix', channel.token, session.json.id);

	return {
		session,
		channel,
		prefix,
	};
};

export const action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();

	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const channel = await Channel.findOne({ id: session.json.id });

	const prefix = formData.get('prefix')?.toString() || '';

	if (!PREFIX_REGEX.test(prefix)) {
		return {
			status: 400,
			data: {
				message: 'invalid prefix',
			},
		};
	}

	PREFIX_REGEX.lastIndex = 0;

	const change = await query('UPDATE', 'Prefix', channel.token, session.json.id, {
		prefix: prefix,
	});

	return change;
};

export default function Settings() {
	const data = useLoaderData();
	const transition = useTransition();
	const [prefix, setPrefix] = useState(data.prefix.data['prefix']);
	const [showedNotification, setShowedNotification] = useState(false);
	const response: Event | undefined = useActionData();
	const [error, setError] = useState('');

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
				<Text>Set a custom prefix for your channel.</Text>
				<Form method="post">
					<TextInput
						label="Prefix"
						name="prefix"
						id="prefix"
						error={error}
						value={prefix}
						autoComplete="off"
						onChange={(event) => {
							if (!PREFIX_REGEX.test(event.target.value)) {
								setError('Invalid prefix');
								setPrefix(event.target.value);
							} else {
								setError('');
								setPrefix(event.target.value);
							}
							PREFIX_REGEX.lastIndex = 0;
						}}
					/>

					<Space h="xs" />
					<Button
						type="submit"
						disabled={prefix === data.prefix.data['enabled'] || error !== ''}
						loading={transition.state == 'submitting'}
					>
						Save
					</Button>
				</Form>
			</Stack>
		</>
	);
}
