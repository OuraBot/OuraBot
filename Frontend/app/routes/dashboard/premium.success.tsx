import { Title, Text, Button, Divider } from '@mantine/core';
import { LoaderArgs, LoaderFunction, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useCallback } from 'react';
import Particles from 'react-particles';
import { badRequest } from 'remix-utils';
import Stripe from 'stripe';
import { loadFull } from 'tsparticles';
import type { Container, Engine } from 'tsparticles-engine';
import { authenticator } from '~/services/auth.server';
import { ChannelModel, IChannel } from '~/services/models/Channel';
import { stripe } from '~/services/stripe.server';

export const loader: LoaderFunction = async ({ request }: LoaderArgs) => {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const url = new URL(request.url);

	const sessionId = url.searchParams.get('session_id');

	if (sessionId === null)
		return {
			success: false,
			message: 'missing params',
		};

	if (!sessionId)
		return {
			success: false,
			message: 'missing params',
		};

	const stripeSession: Stripe.Response<Stripe.Checkout.Session> = await stripe.checkout.sessions.retrieve(sessionId);
	if (!stripeSession.metadata || !stripeSession.metadata['user_db_id'])
		return {
			success: false,
			message: 'stripe session missing metadata',
		};

	const channel: (IChannel & Document) | null = await ChannelModel.findOne({ _id: stripeSession.metadata['user_db_id'] });

	if (!channel)
		return {
			success: false,
			message: 'channel not found',
		};

	if (stripeSession.payment_status === 'paid') {
		// get the order with the matching session id (stored id in the db)
		const order = channel.premium.orders.find((order) => order.id === sessionId);
		if (!order)
			return {
				success: false,
				message: 'order not found, contact support',
			};

		if (order.status === 'PAID') {
			console.log(`order ${order.id} already paid, db has not updated (this is fine)`);
			return {
				success: true,
				gifted: stripeSession.metadata['gifted'] === 'true',
				recipient: stripeSession.metadata['recipient'],
			};
		}

		order.status = 'PAID';
		order.email = stripeSession.customer_details?.email ?? 'customer did not provide email';

		// @ts-ignore
		channel.markModified('premium.orders');

		// @ts-ignore
		await channel.save();
	} else {
		return {
			success: false,
			message: 'payment not completed, contact support',
		};
	}

	return {
		success: true,
		gifted: stripeSession.metadata['gifted'] === 'true',
		recipient: stripeSession.metadata['recipient'],
	};
};

export default function PremiumSuccess() {
	const data = useLoaderData();

	const particlesInit = useCallback(async (engine: Engine) => {
		// console.log(engine);

		// you can initialize the tsParticles instance (engine) here, adding custom shapes or presets
		// this loads the tsparticles package bundle, it's the easiest method for getting everything ready
		// starting from v2 you can add only the features you need reducing the bundle size
		await loadFull(engine);
	}, []);

	const particlesLoaded = useCallback(async (container: Container | undefined) => {
		// await console.log(container);
	}, []);
	return (
		<>
			{data.success ? (
				<>
					<Title>Premium</Title>
					<Title order={3}>Thank you for your purchase!</Title>
					<Text>
						If you have any questions regarding your order, please contact support (<a href="mailto:contact@ourabot.com">contact@ourabot.com</a>)
					</Text>
					{data.gifted && (
						<Text>
							You have gifted <b>{data.recipient}</b> access to OuraBot Premium
						</Text>
					)}
					<Divider my="sm" />

					<Button component="a" href="/dashboard/premium" color="blue">
						Go back
					</Button>
					<Particles
						id="tsparticles"
						init={particlesInit}
						loaded={particlesLoaded}
						options={{
							fullScreen: {
								zIndex: 1,
							},
							particles: {
								color: {
									value: ['#011e32', '#099aff', '#ffff3c'],
								},
								move: {
									direction: 'bottom',
									enable: true,
									outModes: {
										default: 'out',
									},
									size: true,
									speed: {
										min: 1,
										max: 3,
									},
								},
								number: {
									value: 150,
									density: {
										enable: true,
										area: 800,
									},
								},
								opacity: {
									value: 1,
									animation: {
										enable: false,
										startValue: 'max',
										destroy: 'min',
										speed: 0.3,
										sync: true,
									},
								},
								rotate: {
									value: {
										min: 0,
										max: 360,
									},
									direction: 'random',
									move: true,
									animation: {
										enable: true,
										speed: 60,
									},
								},
								tilt: {
									direction: 'random',
									enable: true,
									move: true,
									value: {
										min: 0,
										max: 360,
									},
									animation: {
										enable: true,
										speed: 60,
									},
								},
								shape: {
									type: ['circle', 'square', 'triangle'],
									options: {},
								},
								size: {
									value: {
										min: 2,
										max: 4,
									},
								},
								roll: {
									darken: {
										enable: true,
										value: 30,
									},
									enlighten: {
										enable: true,
										value: 30,
									},
									enable: true,
									speed: {
										min: 15,
										max: 25,
									},
								},
								wobble: {
									distance: 30,
									enable: true,
									move: true,
									speed: {
										min: -15,
										max: 15,
									},
								},
							},
						}}
					/>
				</>
			) : (
				<>
					<Title>Premium</Title>
					<Title order={3}>Something went wrong</Title>

					<Text>{data.message}</Text>
					<Button component="a" href="/dashboard/premium" color="blue">
						Go back
					</Button>
					<Text>
						If you have any questions regarding your order, please contact support (<a href="mailto:contact@ourabot.com">contact@ourabot.com</a>)
					</Text>
				</>
			)}
		</>
	);
}
