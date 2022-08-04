import { Button, Code, createStyles, Divider, PasswordInput, Stack, Switch, Text, TextInput, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { Form, useActionData, useLoaderData, useTransition } from '@remix-run/react';
import type { ActionArgs, LoaderArgs } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import { useState } from 'react';
import { InfoCircle, Link, UserCircle } from 'tabler-icons-react';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import { query } from '~/services/redis.server';

const PREFIX_REGEX = /^[a-zA-Z0-9!@#%^&*()-=_+;:'"<>,./?`~]{1,5}$/;
const DISCORD_WEBHOOK_REGEX = /(^https:\/\/discord.com\/api\/webhooks\/[0-9]+\/.+$|^$)/;
const LASTFM_USERNAME_REGEX = /(^[a-zA-Z0-9_\-]{2,15}$|^$)/;

export async function loader({ request }: LoaderArgs) {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await ChannelModel.findOne({ id: session.json.id });

	const settings = await query('QUERY', 'Settings', channel.token, session.json.id);

	return json({
		session,
		channel,
		settings,
	});
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();

	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const channel = await ChannelModel.findOne({ id: session.json.id });

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

	const lastfmUsername = formData.get('lastfmusername')?.toString() || '';

	if (!LASTFM_USERNAME_REGEX.test(lastfmUsername)) {
		return {
			status: 400,
			data: {
				message: 'invalid lastfm username',
			},
		};
	}

	LASTFM_USERNAME_REGEX.lastIndex = 0;

	const emoteEventsEnabled = formData.get('enabledemoteevents') === 'on' ? true : false;

	const change = await query('UPDATE', 'Settings', channel.token, session.json.id, {
		prefix: prefix,
		clipUrl: clipUrl,
		lastfmUsername: lastfmUsername,
		emoteEventsEnabled: emoteEventsEnabled,
	});

	return change;
}

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
	const data = useLoaderData<typeof loader>();
	const transition = useTransition();
	const { classes } = useStyles();
	const [showedNotification, setShowedNotification] = useState(false);
	const response = useActionData<typeof action>();

	const [prefix, setPrefix] = useState(data.settings.data?.prefix ?? '');
	const [prefixError, setPrefixError] = useState('');

	const [clip, setClip] = useState(data.settings.data?.clipUrl ?? '');
	const [clipError, setClipError] = useState('');

	const [lastfmusername, setLastfmusername] = useState(data.settings.data?.lastfmUsername ?? '');
	const [lastfmusernameError, setLastfmusernameError] = useState('');

	const [emoteUpdatesChecked, setEmoteUpdatesChecked] = useState(data.settings.data?.emoteEventsEnabled ?? false);

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
							description="Discord Webhook URL"
							icon={<Link size={16} />}
							my={0}
						/>
					</div>
					<Divider my="xs" />
					<Title order={3}>Last.fm Username</Title>
					<Text my={0}>
						Manage the{' '}
						<Text variant="link" component="a" href="https://last.fm" target="_blank">
							Last.fm
						</Text>{' '}
						username for the <Code>nowplaying</Code> command
					</Text>
					<div className={classes.prefix}>
						<TextInput
							value={lastfmusername}
							name="lastfmusername"
							id="lastfmusername"
							onChange={(event) => {
								if (!LASTFM_USERNAME_REGEX.test(event.target.value)) {
									setLastfmusernameError('Invalid Last.fm Username');
									setLastfmusername(event.target.value);
								} else {
									setLastfmusernameError('');
									setLastfmusername(event.target.value);
								}
								LASTFM_USERNAME_REGEX.lastIndex = 0;
							}}
							error={lastfmusernameError}
							autoComplete="off"
							autoCapitalize="off"
							description="Username"
							icon={<UserCircle size={16} />}
							my={0}
						/>
					</div>
					<Divider my="xs" />
					<Title order={3}>Emote Events</Title>
					<Text my={0}>
						When Emote Updates are enabled, anytime a{' '}
						<Text variant="link" component="a" href="https://7tv.app" target="_blank">
							SevenTV
						</Text>{' '}
						emote is modified for the channel, it will be posted to chat.{' '}
					</Text>
					<div className={classes.prefix}>
						<Switch
							checked={emoteUpdatesChecked}
							name="enabledemoteevents"
							id="enabledemoteevents"
							label="Emote Events"
							onChange={(event) => {
								setEmoteUpdatesChecked(event.currentTarget.checked);
							}}
						/>
					</div>
					<Divider my="xs" />
					<Button
						className={classes.button}
						type="submit"
						disabled={
							prefixError !== '' ||
							clipError !== '' ||
							lastfmusernameError !== '' ||
							(prefix === (data.settings.data?.prefix ?? '') &&
								clip === (data.settings.data?.clipUrl ?? '') &&
								lastfmusername === (data.settings.data?.lastfmUsername ?? '') &&
								emoteUpdatesChecked === (data.settings.data?.emoteEventsEnabled ?? false))
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
