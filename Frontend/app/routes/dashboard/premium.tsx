import {
	Box,
	Button,
	Card,
	Center,
	Checkbox,
	Collapse,
	Divider,
	Grid,
	HoverCard,
	Loader,
	Overlay,
	Paper,
	Slider,
	Space,
	Stack,
	Text,
	TextInput,
	Title,
	UnstyledButton,
	useMantineTheme,
} from '@mantine/core';
import { useModals } from '@mantine/modals';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { redirect, type ActionFunction, type LoaderFunction, type MetaFunction } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useSubmit } from '@remix-run/react';
import type { Document } from 'mongoose';
import { useEffect, useRef, useState } from 'react';
import emoji from 'react-easy-emoji';
import { badRequest } from 'remix-utils';
import { ArrowBackUp, Clock, ExternalLink, Heart, Icons, InfoCircle } from 'tabler-icons-react';
import { authenticator } from '~/services/auth.server';
import type { IChannel } from '~/services/models/Channel';
import { ChannelModel } from '~/services/models/Channel';
import { purchasePremium } from '~/services/stripe.server';
import type { UserResponse } from '../api/v3/user.$login';

export const meta: MetaFunction = () => {
	return {
		title: 'Premium - OuraBot',
		description: 'Purchase and manage Premium',
	};
};

export const loader: LoaderFunction = async ({ params, request }) => {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await ChannelModel.findOne({ id: session.json.id });

	// check all of the orders if one is still valid
	const subscribed = channel.premium.orders.some((order: any) => {
		return order.status === 'PAID' && order.expiresAt > new Date();
	});

	let expiresAt;
	if (subscribed) {
		expiresAt = channel.premium.orders.at(-1).expiresAt;
	}

	return {
		channel,
		subscribed,
		expiresAt,
	};
};

// Watch out for roll overs (purchasing 3 months in december). One month is 30 days.
function calculateExpirationDate(months: number): Date {
	const currentDate = new Date();
	const currentMonth = currentDate.getMonth();
	const currentYear = currentDate.getFullYear();
	const targetMonth = currentMonth + months;
	const targetYear = currentYear + Math.floor(targetMonth / 12);
	const adjustedMonth = targetMonth % 12;

	const expiresAt = new Date(currentDate);
	expiresAt.setFullYear(targetYear);
	expiresAt.setMonth(adjustedMonth);
	expiresAt.setDate(expiresAt.getDate() + months * 30);

	return expiresAt;
}
export const action: ActionFunction = async ({ request, params }) => {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const formData = await request.formData();
	for (const [key, value] of formData.entries()) {
		console.log(key, value);
	}

	const months = parseInt(formData.get('months_DO_NOT_MODIFY') as string);
	if (isNaN(months)) return badRequest('invalid months');
	if (months < 1 || months > 12) return badRequest('invalid months');

	const recipient = formData.get('recepient_DO_NOT_MODIFY') as string;
	if (!recipient) return badRequest('invalid recipient');

	if (recipient.toLowerCase() !== session.json.login.toLowerCase()) return badRequest('gifting is unavailable at this time');

	const channel: (IChannel & Document) | null = await ChannelModel.findOne({ login: recipient });
	if (!channel) return badRequest('channel not found');

	const sessionData = await purchasePremium(months, channel._id);
	console.log(sessionData);

	channel.premium.orders.push({
		createdAt: new Date(),
		expiresAt: calculateExpirationDate(months),
		duration: months,
		email: 'not yet provided',
		status: 'PENDING',
		id: sessionData.id,
	});

	channel.markModified('premium.orders');

	await channel.save();

	return redirect(sessionData.url ?? '/dashboard/premium/cancel');
};

export default function Premium() {
	const [recepient, setRecepient] = useState('');
	const [checkout, setCheckout] = useState(false);
	const [months, setMonths] = useState(3);
	const [realMonths, setRealMonths] = useState(3);
	const { channel, subscribed, expiresAt } = useLoaderData();
	const actionData = useActionData();
	const [error, setError] = useState('');
	const [gifting, setGifting] = useState(subscribed);
	const [queriedLogin, setQueriedLogin] = useState('');
	const theme = useMantineTheme();
	const modals = useModals();
	const [shownModal, setShownModal] = useState(false);

	const handleCheckout = async () => {
		if (gifting) {
			if (recepient.toLowerCase() === channel.login.toLowerCase()) return setError('You cannot gift to yourself');
			if (queriedLogin === recepient) return setError('Please enter a different recepient');
			setQueriedLogin(recepient);

			const user: UserResponse | null = await fetch('/api/v3/user/' + recepient)
				.then((res) => res.json())
				.catch(() => setError('User not found on OuraBot'));
			// setCheckout(true);

			console.log(user);

			if (!user) return setError('User not found on OuraBot');

			if (user.premium.active == false) {
				setCheckout(true);
				setRealMonths(months);
			} else {
				return setError('User already has premium');
			}
		} else {
			const user: UserResponse | null = await fetch('/api/v3/user/' + channel.login)
				.then((res) => res.json())
				.catch(() => setError('User not found on OuraBot'));

			if (!user) return setError('User not found on OuraBot');
			if (user.premium.active == true) return setError('You already have premium');
			setCheckout(true);
			setRealMonths(months);
		}
	};

	/* MIGRATE TO PREMIUM.SUCCESS.TSX
	if (actionData && !actionData.error && !shownModal) {
		setShownModal(true);
		modals.openModal({
			size: 'lg',
			overlayBlur: 0.75,
			overlayColor: theme.colorScheme === 'dark' ? theme.colors.dark[9] : theme.colors.gray[2],
			overlayOpacity: 0.55,
			transition: 'fade',
			transitionDuration: 300,
			transitionTimingFunction: 'ease',
			title: (
				<>
					<Title order={3}>Thank you for your purchase!</Title>
				</>
			),
			children: (
				<>
					{actionData?.recepient === channel.login ? (
						<>
							<Text>
								You have subscribed to premium for {actionData?.months} {actionData?.months === 1 ? 'month' : 'months'}. It will expire on{' '}
								{new Date(actionData?.expiresAt)?.toUTCString()}.
							</Text>
							<Text>It really helps out a lot, so thank you for your support! {'<3'}</Text>
							<Text>If you need any help, please contact support</Text>
						</>
					) : (
						<>
							<Text>
								You have just gifted premium to {actionData?.recepient} for {actionData?.months} {actionData?.months === 1 ? 'month' : 'months'}. It will
								expire on {new Date(actionData?.expiresAt)?.toUTCString()}.
							</Text>
							<Text>It really helps out a lot, so thank you for your support! {'<3'}</Text>
							<Text>If you need any help, please contact support</Text>
						</>
					)}
				</>
			),
		});
	}
	*/

	return (
		<>
			{subscribed ? (
				<>
					<Title order={3}>You already have premium, thanks for your support! {emoji('💙')}</Title>
					<Text color="dimmed" size="xs">
						Your support genuinely means a lot to me, thank you so much! {'<3'}
					</Text>
					{/* <Text>You can gift premium to other people below</Text> */}
					<Text>
						Your premium will expire on <strong>{new Date(expiresAt)?.toUTCString()}</strong>
					</Text>
					<Divider variant="solid" my="md" />
				</>
			) : null}
			<Collapse in={!checkout}>
				<Text>
					Hosting and maintaining this bot is unfortunately not free. You can support the developer by purchasing a <strong>non-recurring</strong> payment.
				</Text>
				<Text>
					If you have any questions, please email <strong>contact@ourabot.com</strong>. All payments are non-refundable.
				</Text>
				<Box>
					<Paper
						m="sm"
						style={{
							backgroundColor: 'transparent',
						}}
					>
						<Card.Section>
							<Grid grow>
								<Grid.Col md={6} lg={3}>
									<Card>
										<Title order={4}>
											<Icons size={16} /> Special Features
										</Title>
										<Text>Gain access to special commands and modules that are only available to premium users! (coming soon)</Text>
									</Card>
								</Grid.Col>
								<Grid.Col md={6} lg={3}>
									<Card>
										<Title order={4}>
											<Clock size={16} /> Early Access
										</Title>
										<Text>Gain early access to new features and commands before they are available publicly!</Text>
									</Card>
								</Grid.Col>
								<Grid.Col md={6} lg={3}>
									<Card>
										<Title order={4}>
											<Heart size={16} /> Support the Developer
										</Title>
										<Text>I am a solo developer, and I work on this bot in my free time. Your support means a lot to me!</Text>
									</Card>
								</Grid.Col>
							</Grid>
						</Card.Section>
					</Paper>
				</Box>

				<Divider variant="solid" my="md" />
				<Slider
					my="lg"
					value={months}
					onChange={setMonths}
					min={1}
					max={12}
					label={(value) => `${value} month${value == 1 ? '' : 's'}`}
					mx="md"
					marks={[
						{ value: 1 },
						{ value: 2 },
						{ value: 3 },
						{ value: 4 },
						{ value: 5 },
						{ value: 6 },
						{ value: 7 },
						{ value: 8 },
						{ value: 9 },
						{ value: 10 },
						{ value: 11 },
						{ value: 12 },
					]}
				/>
				<Title order={2}>{`$${months * 4} USD`} </Title>
				<Text size="lg" mb="md">
					{months} month{months == 1 ? '' : 's'}
				</Text>

				<Checkbox
					label="Gift to another user"
					disabled // TODO: Enable this when gifting is available
					checked={gifting}
					onChange={(event) => {
						if (subscribed && !event.target.checked) return;
						setGifting(event.target.checked);
						setRecepient('');
					}}
				/>
				<Text size="xs" color="dimmed">
					Gifting will be available soon!
				</Text>

				<Collapse in={gifting}>
					<TextInput
						disabled // TODO: Enable this when gifting is available
						label="Gift to"
						error={error}
						autoFocus
						placeholder="Username"
						value={recepient}
						onChange={(event) => {
							setRecepient(event.target.value);
							setError('');
						}}
					/>
				</Collapse>
				<Button
					my="md"
					fullWidth
					disabled={subscribed} // TODO: Enable this when gifting is available
					onClick={() => {
						handleCheckout();
					}}
				>
					Checkout
				</Button>
			</Collapse>
			{checkout && (
				<>
					<UnstyledButton
						onClick={() => {
							setCheckout(false);
						}}
					>
						<ArrowBackUp />
					</UnstyledButton>
					<Center>
						<Stack>
							<Text size="lg" align="center">
								<strong>
									${realMonths * 4} for {realMonths} month{realMonths == 1 ? '' : 's'} ({realMonths * 30} days)
								</strong>
							</Text>
							{console.log(channel)}
							<Text align="center">
								<div style={{ display: 'flex', alignItems: 'center' }}>
									<Space w="xs" />
									<HoverCard width={280} shadow="md">
										<HoverCard.Target>
											<div style={{ display: 'flex', alignItems: 'center' }}>
												<InfoCircle size={18} />
												<Space w={2} />
											</div>
										</HoverCard.Target>
										<HoverCard.Dropdown>
											<Text size="sm">
												This is the username of the channel you are purchasing premium for. If this is not correct, please check the gifted field
												(go back)
											</Text>
										</HoverCard.Dropdown>
									</HoverCard>
									<Text
										variant="link"
										component="a"
										href={`https://twitch.tv/${gifting && recepient.length > 0 ? recepient : channel.login}`}
										target="_blank"
									>
										https://twitch.tv/{gifting && recepient.length > 0 ? recepient : channel.login}
									</Text>
								</div>
							</Text>
							{/* <PayPalScriptProvider
								options={{
									'client-id': cid,
									components: 'buttons',
									currency: 'USD',
								}}
							>
								<ButtonWrapper
									amount={pricePoints[realMonths]}
									currency={currency}
									showSpinner={true}
									recepient={gifting && recepient.length > 0 ? recepient : channel.login}
									months={realMonths}
								/>
							</PayPalScriptProvider> */}
							<Form method="post">
								<input type="hidden" name="months_DO_NOT_MODIFY" value={realMonths} />
								<input type="hidden" name="recepient_DO_NOT_MODIFY" value={gifting && recepient.length > 0 ? recepient : channel.login} />
								<Button type="submit" fullWidth leftIcon={<ExternalLink />}>
									Pay with Stripe
								</Button>
							</Form>
						</Stack>
					</Center>
				</>
			)}
		</>
	);
}

const currency = 'USD';
const style = { layout: 'vertical' };

// Custom component to wrap the PayPalButtons and handle currency changes
const ButtonWrapper = ({ amount, currency, showSpinner, recepient, months }: any) => {
	// usePayPalScriptReducer can be use only inside children of PayPalScriptProviders
	// This is the main reason to wrap the PayPalButtons in a new component

	const [{ options, isPending, isRejected }, dispatch] = usePayPalScriptReducer();
	const submit = useSubmit();
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		dispatch({
			type: 'resetOptions',
			value: {
				...options,
				currency: currency,
			},
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currency, showSpinner]);

	return (
		<>
			{showSpinner && isPending && (
				<Center>
					<Loader />
				</Center>
			)}
			{showSpinner && isRejected && <Text>There was an error with PayPal. Please refresh the page and try again.</Text>}
			<Form ref={formRef}>
				{months}
				<PayPalButtons
					style={{
						layout: 'vertical',
						color: 'blue',
						shape: 'pill',
						label: 'pay',
					}}
					disabled={false}
					forceReRender={[amount, currency, style]}
					fundingSource={'paypal'}
					createOrder={(data, actions) => {
						return actions.order
							.create({
								purchase_units: [
									{
										description: `${months} month${months == 1 ? '' : 's'} OuraBot Premium`,
										custom_id: `premium-${months}-${recepient}`,
										amount: {
											currency_code: currency,
											value: amount,
										},
									},
								],
								application_context: {
									shipping_preference: 'NO_SHIPPING',
									brand_name: 'OuraBot',
								},
							})
							.then((orderId) => {
								return orderId;
							});
					}}
					onApprove={function (data, actions) {
						if (!actions.order) throw new Error('order is undefined');
						return actions.order.capture().then(async (details) => {
							console.log('Payment Complete!');

							if (!formRef.current) throw new Error('formRef is undefined');

							// This is not the best way of doing this but its better than creating an
							// api route and using fetch to send the data
							const formData = new FormData(formRef.current);
							formData.set('orderID', details.id);
							formData.set('recepient', recepient);
							formData.set('months', months);

							submit(formData, {
								method: 'post',
							});
						});
					}}
				/>
			</Form>
		</>
	);
};
