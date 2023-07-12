import { Title, Text, Button, Divider } from '@mantine/core';
import { LoaderArgs, LoaderFunction } from '@remix-run/node';
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
	console.log(sessionId);

	if (!sessionId) return badRequest('missing params');

	const stripeSession: Stripe.Response<Stripe.Checkout.Session> = await stripe.checkout.sessions.retrieve(sessionId);
	if (!stripeSession.metadata || !stripeSession.metadata['user_db_id']) return badRequest('missing metadata');

	const channel: (IChannel & Document) | null = await ChannelModel.findOne({ _id: stripeSession.metadata['user_db_id'] });

	if (!channel) return badRequest('channel not found');

	console.log(stripeSession);

	if (stripeSession.payment_status === 'paid') {
		// get the order with the matching session id (stored id in the db)
		const order = channel.premium.orders.find((order) => order.id === sessionId);
		if (!order) return badRequest('order not found, contact support');

		if (order.status === 'PAID') return badRequest('order already paid');

		order.status = 'PAID';
		order.email = stripeSession.customer_details?.email ?? 'customer did not provide email';

		// @ts-ignore
		channel.markModified('premium.orders');

		// @ts-ignore
		await channel.save();
	} else {
		return badRequest('payment not completed, contact support');
	}

	return {
		success: true,
	};
};

export default function PremiumSuccess() {
	const data = useLoaderData();
	const particlesInit = useCallback(async (engine: Engine) => {
		console.log(engine);

		// you can initialize the tsParticles instance (engine) here, adding custom shapes or presets
		// this loads the tsparticles package bundle, it's the easiest method for getting everything ready
		// starting from v2 you can add only the features you need reducing the bundle size
		await loadFull(engine);
	}, []);

	const particlesLoaded = useCallback(async (container: Container | undefined) => {
		await console.log(container);
	}, []);
	return (
		<>
			<Title>Premium</Title>
			<Title order={3}>Thank you for your purchase!</Title>
			<Text>If you have any questions regarding your order, please contact support (contact@ourabot.com)</Text>
			<Divider my="sm" />
			<Text>
				You purchased <b>non-recurring</b> access to OuraBot Premium. You will <b>not</b> be charged when your access expires, but will be notified in your chat.
			</Text>
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
	);
}
