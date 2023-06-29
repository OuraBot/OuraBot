import { Form, useActionData, useLoaderData, useNavigate } from '@remix-run/react';
import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/server-runtime';
import { authenticator } from '~/services/auth.server';
import { Badge, Button, Code, Divider, Loader, Text, TextInput, Title, createStyles } from '@mantine/core';
import { ChannelModel, IChannel } from '~/services/models/Channel';
import { Schema, model } from 'mongoose';
import { UserCircle } from 'tabler-icons-react';
import { useState } from 'react';
import { query } from '~/services/redis.server';
import * as crypto from 'crypto';

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
	const { channel } = useLoaderData();
	const { classes } = useStyles();
	const [usernameError, setUsernameError] = useState<string | null>(null);
	const [username, setUsername] = useState<string>(channel.kick.slug ?? '');
	const navigate = useNavigate();
	const handleClick = () => {
		navigate('.', { replace: true });
	};
	const TWITCH_REGEX = /^[a-zA-Z0-9_]{2,25}$/;

	console.log(channel.kick.slug, 'channel.kick.slug');

	return (
		<>
			<Text>
				Use certain parts of OuraBot on{' '}
				<Text variant="link" component="a" href="https://kick.com" target="_blank">
					Kick.com
				</Text>
				<Divider my="sm" />
				<Title order={2}>Link Account</Title>
				{/* {data ? JSON.stringify(data) : <Loader />} */}
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
						<Button my="sm" type="submit" disabled={usernameError !== null || username === '' || channel.kick.slug !== ''}>
							Begin Link Process
						</Button>
					</div>
				</Form>
				<Form method="post">
					<input type="hidden" name="stage" value="delete" />
					<Button type="submit" color="red" size="xs" compact variant="outline" disabled={channel.kick.slug === ''}>
						Change Username
					</Button>
				</Form>
				{(data && data?.status === 200 && data?.data?.verificationCode) || (channel.kick.verificationCode && !channel.kick.secretConfirmed) ? (
					<>
						<Text mt="sm">
							Open your Kick chat and say <Code>!verify {data?.data?.verificationCode || channel?.kick?.verificationCode}</Code>
						</Text>

						<Form method="get">
							<Button type="submit">Check</Button>
						</Form>
					</>
				) : null}
			</Text>
			{/* <Prism withLineNumbers language="json">
				{JSON.stringify(channel, null, 2)}
			</Prism> */}
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
