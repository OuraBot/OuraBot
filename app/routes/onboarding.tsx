import { Paper, Button, Container, Title, Group, Avatar, Text, Divider, Checkbox, Center, Image } from '@mantine/core';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '~/utils/redirect.server';
import { Form, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/services/auth.server';
import { _model as Channel } from '~/services/models/Channel';
import { useModals } from '@mantine/modals';
import type { TwitchSession } from '~/services/oauth.strategy';
import { useState } from 'react';
import { sign } from '~/utils/jsonwebtoken.server';

export const loader: LoaderFunction = async ({ request }) => {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	console.log(session.json);

	const channel = await Channel.findOne({ id: session.json.id });

	console.log(channel, 'chnl fnd');

	if (channel) return redirect('/dashboard');
	return {
		session: session.json,
	};
};

export const action: ActionFunction = async ({ request }) => {
	const session: TwitchSession = (
		await authenticator.isAuthenticated(request, {
			failureRedirect: '/login',
		})
	).json;

	const token = sign({ id: session.id }, process.env.SECRET || 'secret');

	await Channel.create({
		login: session.login,
		id: session.id,
		token: token,
		profile_image_url: session.profile_image_url,
	});

	return redirect(`/dashboard`);
};

export default function Onboarding() {
	const loaderData: { session: TwitchSession } = useLoaderData();
	const [openedTos, setOpenedTos] = useState(false);
	const [agreed, setAgreed] = useState(false);
	const [kappad, setKappad] = useState(false);
	const modals = useModals();
	const openContentModal = () => {
		const id = modals.openModal({
			title: kappad
				? 'Can you just read the Terms of Service please...'
				: 'Did you really read the Terms of Service?',
			children: (
				<>
					{kappad ? (
						<>
							<Center>
								<Image src="/resources/PoroSad.png" width="5rem" />
							</Center>

							<Button
								onClick={() => {
									modals.closeModal(id);
									setKappad(false);
								}}
								fullWidth
								mt="md"
							>
								Okay, I will REALLY read them now
							</Button>
						</>
					) : (
						<>
							<Group grow>
								<Button
									color="green"
									fullWidth
									variant="light"
									onClick={() => {
										modals.closeModal(id);
										openKappaModal();
									}}
									mt="md"
								>
									Yes
								</Button>
								<Button
									variant="light"
									color="red"
									fullWidth
									onClick={() => modals.closeModal(id)}
									mt="md"
								>
									No
								</Button>
							</Group>
						</>
					)}
				</>
			),
		});
	};

	const openKappaModal = () => {
		const id = modals.openModal({
			title: 'Sure you did...',
			children: (
				<>
					<Center>
						<Image src="/resources/Kappa.png" width="5rem" />
					</Center>

					<Button
						onClick={() => {
							modals.closeModal(id);
							setKappad(true);
						}}
						fullWidth
						mt="md"
					>
						Okay, I will read them now
					</Button>
				</>
			),
		});
	};

	return (
		<Container size="sm">
			<Paper withBorder shadow="md" p="lg" mt="lg" radius="md">
				<Form method="post">
					<Title order={2}>
						<Group noWrap>
							Hello {loaderData.session.display_name}
							<Avatar size="md" radius="xl" src={loaderData.session.profile_image_url} />
						</Group>
					</Title>
					<Divider my="sm" />
					<Text>
						Before you can use OuraBot, you need to agree to our{' '}
						<Text
							variant="link"
							component="a"
							target="_blank"
							href="/tos"
							onClick={() => setOpenedTos(true)}
						>
							Terms of Service.
						</Text>
					</Text>

					<Form method="post">
						<Checkbox
							mt="sm"
							label="I have agree with the Terms of Service"
							name="tos"
							checked={agreed}
							required
							onChange={() => {
								if (!openedTos) openContentModal();
								else setAgreed(!agreed);
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
