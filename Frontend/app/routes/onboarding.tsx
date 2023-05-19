import { Avatar, Button, Center, Checkbox, Container, Divider, Group, Image, Paper, Text, Title } from '@mantine/core';
import { useModals } from '@mantine/modals';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import type { TwitchSession } from '~/services/oauth.strategy';
import { query, StatusCodes } from '~/services/redis.server';
import { sign } from '~/utils/jsonwebtoken.server';
import { redirect } from '~/utils/redirect.server';

export async function loader({ request }: LoaderArgs) {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const channel = await ChannelModel.findOne({ id: session.json.id });

	if (channel) return redirect('/dashboard');
	return json({
		session: session.json,
	});
}

export async function action({ request }: ActionArgs) {
	const session: TwitchSession = (
		await authenticator.isAuthenticated(request, {
			failureRedirect: '/login',
		})
	).json;

	if (!process.env.JWT_SECRET) {
		console.warn('JWT_SECRET is not set, falling back to "secret"');
	}

	const token = sign({ id: session.id }, process.env.JWT_SECRET || 'secret');

	await ChannelModel.create({
		login: session.login,
		id: session.id,
		token: token,
		profile_image_url: session.profile_image_url,
	});

	let resp = await query('UPDATE', 'Join', token, session.id, {
		login: session.login,
	});

	if (resp.status !== 200) {
		throw new Error(`UPDATE Join returned error code ${resp.status}`);
	} else {
		return redirect(`/dashboard`);
	}
}

export default function Onboarding() {
	const loaderData: { session?: TwitchSession } = useLoaderData<typeof loader>();
	const [agreed, setAgreed] = useState(false);
	const modals = useModals();

	return (
		<Container size="sm">
			<Paper withBorder shadow="md" p="lg" mt="lg" radius="md">
				<Form method="post">
					<Title order={2}>
						<Group noWrap>
							Hello {loaderData?.session?.display_name ?? ''}
							<Avatar size="md" radius="xl" src={loaderData?.session?.profile_image_url ?? ''} />
						</Group>
					</Title>
					<Divider my="sm" />
					<Text>
						Before you can use OuraBot, you need to agree to our{' '}
						<Text variant="link" component="a" target="_blank" href="/tos">
							Terms of Service
						</Text>{' '}
						and{' '}
						<Text variant="link" component="a" target="_blank" href="/privacy">
							Privacy Policy.
						</Text>{' '}
						Cookies will be used to store your session.
					</Text>

					<Form method="post">
						<Checkbox
							mt="sm"
							label="I agree with the Terms of Service and Privacy Policy"
							name="tos"
							checked={agreed}
							required
							onChange={() => {
								setAgreed(!agreed);
							}}
						/>
						<Button my="md" fullWidth type="submit">
							Create account
						</Button>
					</Form>
				</Form>
			</Paper>
		</Container>
	);
}
