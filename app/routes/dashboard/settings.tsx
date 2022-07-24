import { ActionFunction, LoaderFunction } from '@remix-run/server-runtime';
import { _model as Channel } from '~/services/models/Channel';
import { authenticator } from '~/services/auth.server';
import { Event, query } from '~/services/redis.server';
import { Form, useActionData, useLoaderData, useTransition } from '@remix-run/react';
import { Stack, Title, Text, TextInput, Divider, createStyles, Code, Button, PasswordInput } from '@mantine/core';
import { InfoCircle, Link } from 'tabler-icons-react';
import { useState } from 'react';
import { showNotification } from '@mantine/notifications';

const PREFIX_REGEX = /^[a-zA-Z0-9!@#%^&*()-=_+;:'"<>,./?`~]{1,5}$/;
const DISCORD_WEBHOOK_REGEX = /(^https:\/\/discord.com\/api\/webhooks\/[0-9]+\/.+$|^$)/;

export const loader: LoaderFunction = async ({ request }) => {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await Channel.findOne({ id: session.json.id });

	const settings = await query('QUERY', 'Settings', channel.token, session.json.id);

	return {
		session,
		channel,
		settings,
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

	let clipUrl = formData.get('clipurl')?.toString() || '';

	if (!DISCORD_WEBHOOK_REGEX.test(clipUrl)) {
		clipUrl = '';
	}

	DISCORD_WEBHOOK_REGEX.lastIndex = 0;

	const change = await query('UPDATE', 'Settings', channel.token, session.json.id, {
		prefix: prefix,
		clipUrl: clipUrl,
	});

	return change;
};

const useStyles = createStyles((theme) => ({
	prefix: {
		width: '15em',

		[`@media (max-width: ${theme.breakpoints.sm}px)`]: {
			width: '100%',
		},
	},
	clip: {
		width: '40em',

		[`@media (max-width: ${theme.breakpoints.md}px)`]: {
			width: '100%',
		},

		[`@media (max-width: ${theme.breakpoints.sm}px)`]: {
			width: '100%',
		},
	},
	button: {
		width: '5em',

		[`@media (max-width: ${theme.breakpoints.sm}px)`]: {
			width: '100%',
		},
	},
}));

export default function Settings() {
	const data = useLoaderData();
	const transition = useTransition();
	const { classes } = useStyles();
	const [showedNotification, setShowedNotification] = useState(false);
	const response: Event | undefined = useActionData();

	const [prefix, setPrefix] = useState(data.settings.data['prefix']);
	const [prefixError, setPrefixError] = useState('');

	const [clip, setClip] = useState(data.settings.data['clipUrl']);
	const [clipError, setClipError] = useState('');

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
				<Form method="post">
					<Title order={3}>Prefix</Title>
					<Text my={0}>Manage the prefix for your channel. This is required to use any default commands</Text>
					<div className={classes.prefix}>
						<TextInput
							value={prefix}
							name="prefix"
							id="prefix"
							onChange={(event) => {
								if (!PREFIX_REGEX.test(event.target.value)) {
									setPrefixError('Invalid prefix');
									setPrefix(event.target.value);
								} else {
									setPrefixError('');
									setPrefix(event.target.value);
								}
								PREFIX_REGEX.lastIndex = 0;
							}}
							error={prefixError}
							autoComplete="off"
							autoCapitalize="off"
							description="Letters, numbers, symbols, 1-5 chars"
							icon={<InfoCircle size={16} />}
							my={0}
						/>
					</div>
					<Divider my="xs" />
					<Title order={3}>Clip Webhook</Title>
					<Text my={0}>
						Manage the Discord Webhook for the <Code>clip</Code> command
					</Text>
					<div className={classes.clip}>
						<PasswordInput
							value={clip}
							name="clipurl"
							id="clipurl"
							onChange={(event) => {
								if (!DISCORD_WEBHOOK_REGEX.test(event.target.value)) {
									setClipError('Invalid Webhook');
									setClip(event.target.value);
								} else {
									setClipError('');
									setClip(event.target.value);
								}
								DISCORD_WEBHOOK_REGEX.lastIndex = 0;
							}}
							error={clipError}
							autoComplete="off"
							autoCapitalize="off"
							description="Letters, numbers, symbols, 1-5 chars"
							icon={<Link size={16} />}
							my={0}
						/>
					</div>
					<Divider my="xs" />
					<Button
						className={classes.button}
						type="submit"
						disabled={
							prefixError !== '' ||
							clipError !== '' ||
							(prefix === data.settings.data['prefix'] && clip === data.settings.data['clipUrl'])
						}
						loading={transition.state == 'submitting'}
					>
						Save
					</Button>
				</Form>
			</Stack>
		</>
	);
}
