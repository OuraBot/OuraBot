import { Form, useActionData, useLoaderData, useNavigate } from '@remix-run/react';
import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/server-runtime';
import { authenticator } from '~/services/auth.server';
import { ActionIcon, Badge, Button, Code, Divider, Loader, Overlay, Switch, Text, TextInput, ThemeIcon, Title, Tooltip, createStyles } from '@mantine/core';
import { ChannelModel, IChannel } from '~/services/models/Channel';
import { Schema, model } from 'mongoose';
import { Star, UserCircle } from 'tabler-icons-react';
import { useState } from 'react';
import { query } from '~/services/redis.server';
import * as crypto from 'crypto';
import emoji from 'react-easy-emoji';
import PremiumBadge from '~/components/PremiumBadge';

export async function loader({ request }: LoaderArgs) {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await ChannelModel.findOne({ id: session.json.id });

	const subscribed = channel.premium.orders.some((order: any) => {
		return order.status === 'PAID' && order.expiresAt > new Date();
	});

	return {
		session,
		channel,
		subscribed,
	};
}

export async function action({ request }: ActionArgs) {
	console.log('action');

	const formData = await request.formData();

	for (const [key, value] of formData.entries()) {
		console.log(`${key}: ${value}`);
	}

	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const channel = await ChannelModel.findOne({ id: session.json.id });

	if (!channel) {
		return { status: 404 };
	}

	const stage = formData.get('stage')?.toString() || '';

	let returnData: any = null;

	switch (stage) {
		case 'username':
			{
				const username = formData.get('username')?.toString() || '';

				if (username === '') {
					return {
						status: 400,
						data: {
							message: 'invalid username',
						},
					};
				}

				if (!TWITCH_REGEX.test(username)) {
					return {
						status: 400,
						data: {
							message: 'invalid username',
						},
					};
				}

				TWITCH_REGEX.lastIndex = 0;

				const kickChannel = await query('QUERY', 'Kick', channel.token, session.json.id, {
					username,
				});

				if (kickChannel.status !== 200 || kickChannel.data === null) {
					return {
						status: 400,
						data: {
							message: 'invalid username',
						},
					};
				}

				// Generate a unique code
				const verificationCode = generateRandomString();
				console.log(verificationCode);
				console.log(kickChannel.data!.channel, 'kickChannel.data');
				channel.kick.verificationCode = verificationCode;
				channel.kick.id = kickChannel.data!.channel!['id'] ?? '';
				channel.kick.user_id = kickChannel.data!.channel!['user_id'] ?? '';
				channel.kick.slug = kickChannel.data!.channel!['slug'] ?? '';
				channel.kick.chatroom_id = kickChannel.data!.channel!['chatroom']['id'] ?? '';
				channel.kick.chatroom_channel_id = kickChannel.data!.channel!['chatroom']['channel_id'] ?? '';
				channel.kick.streamer_id = '';
				channel.kick.linkedAt = null;
				const expiresAt = new Date(Date.now() + 1000 * 60 * 5); // 5 minutes
				channel.kick.codeExpiresAt = expiresAt;

				channel.markModified('kick');
				await channel.save();

				returnData = {
					status: 200,
					data: {
						message: 'success',
						verificationCode,
						expiresAt,
					},
				};
			}
			break;

		case 'delete':
			// eslint-disable-next-line no-lone-blocks
			{
				channel.kick.verificationCode = '';
				channel.kick.id = '';
				channel.kick.user_id = '';
				channel.kick.slug = '';
				channel.kick.chatroom_id = '';
				channel.kick.chatroom_channel_id = '';
				channel.kick.streamer_id = '';
				channel.kick.linkedAt = null;
				channel.kick.codeExpiresAt = null;
				channel.kick.secretConfirmed = false;

				channel.markModified('kick');
				await channel.save();

				returnData = {
					status: 200,
					data: {
						message: 'success',
					},
				};
			}
			break;

		case 'livenotification':
			{
				const rawliveenabled = formData.get('liveenabled');
				const liveenabled: boolean = rawliveenabled == 'on' ? true : false;

				channel.modules.livekick.enabled = liveenabled;

				channel.markModified('modules.livekick');

				await channel.save();

				returnData = {
					status: 200,
					data: {
						message: 'success',
					},
				};
			}
			break;
	}

	return returnData;
}

export const meta: MetaFunction = () => {
	return {
		title: 'Kick - OuraBot',
		description: 'Connect with Kick',
	};
};

const useStyles = createStyles((theme) => ({
	username: {
		width: '15em',

		[`@media (max-width: ${theme.breakpoints.sm}px)`]: {
			width: '100%',
		},
	},
}));

const TWITCH_REGEX = /^[a-zA-Z0-9_]{2,25}$/;

export default function Kick() {
	const data = useActionData();
	const { channel, subscribed } = useLoaderData();
	const { classes } = useStyles();
	const [usernameError, setUsernameError] = useState<string | null>(null);
	const [username, setUsername] = useState<string>(channel.kick.slug ?? '');
	const navigate = useNavigate();
	const [liveChecked, setLiveChecked] = useState<boolean>(channel.modules.livekick.enabled);
	const handleClick = () => {
		navigate('.', { replace: true });
	};
	const TWITCH_REGEX = /^[a-zA-Z0-9_]{2,25}$/;

	console.log(channel.kick.slug, 'channel.kick.slug');

	return (
		<>
			{subscribed && (
				<>
					<Text size="lg" weight="bolder">
						You must have Premium to use this feature.
					</Text>
					<Text size="md" weight="bold">
						<Text variant="link" component="a" href="/dashboard/premium" target="_blank">
							Click here for more info (only $4)
						</Text>
					</Text>
					<Divider my="md" />
				</>
			)}
			<div style={{ opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}>
				<Text>
					<Title order={2}>Live Announcements</Title>
					<Text>
						Notify your Twitch chat whenever you go live on{' '}
						<Text variant="link" component="a" href="https://kick.com" target="_blank">
							Kick.com
						</Text>
					</Text>
					<Form method="post">
						<input type="hidden" name="stage" value="livenotification" />
						<div className={classes.username}>
							<Switch
								name="liveenabled"
								id="liveenabled"
								mt="xs"
								label="Enabled"
								checked={liveChecked}
								onChange={() => setLiveChecked(!liveChecked)}
								disabled={!subscribed || !channel.kick.secretConfirmed}
							/>
							<Button type="submit" disabled={liveChecked === channel.modules.livekick.enabled || !subscribed || !channel.kick.secretConfirmed}>
								Save
							</Button>
						</div>
					</Form>
				</Text>
				<Divider my="sm" />

				<Title order={2}>Link Account</Title>
				{channel.kick.secretConfirmed ? <Badge color="green">Account Linked</Badge> : <Badge color="red">Account Not Linked</Badge>}
				<Form method="post">
					<input type="hidden" name="stage" value="username" />
					<div className={classes.username}>
						<TextInput
							label="Kick Username"
							placeholder="Username"
							autoComplete="off"
							id="username"
							name="username"
							icon={<UserCircle size={16} />}
							required
							error={usernameError}
							disabled={channel.kick.slug !== ''}
							value={username}
							onChange={(e) => {
								setUsername(e.currentTarget.value);
								if (!TWITCH_REGEX.test(e.currentTarget.value)) {
									TWITCH_REGEX.lastIndex = 0;
									setUsernameError('Invalid username');
								} else {
									setUsernameError(null);
								}
							}}
						/>
						{!channel.kick.secretConfirmed && (
							<Button my="sm" type="submit" disabled={usernameError !== null || username === '' || channel.kick.slug !== ''}>
								Begin Link Process
							</Button>
						)}
					</div>
				</Form>
				{channel.kick.secretConfirmed && (
					<Form method="post">
						<input type="hidden" name="stage" value="delete" />
						<Button type="submit" color="red" size="xs" compact variant="outline" disabled={channel.kick.slug === ''} my="sm">
							Unlink Account
						</Button>
					</Form>
				)}
				{(data && data?.status === 200 && data?.data?.verificationCode) || (channel.kick.verificationCode && !channel.kick.secretConfirmed) ? (
					<>
						<Text mt="sm">
							Open your Kick chat and say <Code>!verify {data?.data?.verificationCode || channel?.kick?.verificationCode}</Code>
						</Text>
						<Text size="xs">Once done, press the button below to check if it worked</Text>

						<Form method="get">
							<Button type="submit" mt="xs">
								Check
							</Button>
						</Form>
					</>
				) : null}
			</div>
		</>
	);
}

function generateRandomString(): string {
	const length = 16;
	const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let randomString = '';

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		randomString += characters.charAt(randomIndex);
	}

	return randomString;
}

// export default function Kick() {
// 	return (
// 		<>
// 			<Text>
// 				You aren't supposed to be here {emoji(`🤦‍♂️`)}, but I'll let you in on a secret. Kick support is coming soon. Just don't tell anyone {emoji(`🤫`)}
// 			</Text>
// 			<Button component="a" href="/dashboard/" mt="sm">
// 				Go Back
// 			</Button>
// 		</>
// 	);
// }
