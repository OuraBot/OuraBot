import {
	Badge,
	Box,
	Button,
	Card,
	Center,
	Checkbox,
	Collapse,
	Divider,
	Grid,
	Loader,
	Paper,
	Slider,
	Stack,
	Text,
	TextInput,
	Title,
	UnstyledButton,
	useMantineTheme,
} from '@mantine/core';
import { useModals } from '@mantine/modals';
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useSubmit, Link } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { badRequest } from 'remix-utils';
import { ArrowBackUp } from 'tabler-icons-react';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import { getOrderDetails } from '~/utils/paypal.server';
import { UserResponse } from '../api/v3/user.$login';

const pricePoints = [
	0, // 0 month
	4, // 1 month
	8, // 2 months
	12, // 3 months
	16, // 4 months
	// Save $1/month for each additional month
	19, // 5 months
	22, // 6 months
	25, // 7 months
	28, // 8 months
	31, // 9 months
	34, // 10 months
	37, // 11 months
	40, // 12 months
];

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

	const cid = process.env.PAYPAL_CLIENT_ID;

	return {
		cid,
		channel,
		subscribed,
		expiresAt,
	};
};

export const action: ActionFunction = async ({ request, params }) => {
	const formData = await request.formData();

	const orderID = formData.get('orderID') as string;
	const recepient = formData.get('recepient') as string;
	const months = parseInt((formData.get('months') as string) ?? '0');

	const orderDetails = await getOrderDetails(orderID);

	if (!orderDetails) return badRequest('order not found');

	if (orderDetails.status !== 'COMPLETED') return badRequest('order not completed');

	// check if the order id has only been used once
	const pastOrders = await ChannelModel.find({ 'premium.orders.id': orderID });
	if (pastOrders?.length > 0) return badRequest('order id already used. contact support');

	const channel = await ChannelModel.findOne({ login: recepient });
	if (!channel) return badRequest('channel not found');

	const purchasedUnit = orderDetails.purchase_units[0];
	const idInfo = purchasedUnit.custom_id.split('-');

	const _months = parseInt(idInfo[1]);
	const _recepient = idInfo[2];

	if (_recepient !== recepient) return badRequest('invalid recepient');
	if (_months !== months) return badRequest('invalid months');

	channel.premium.orders.push({
		id: orderID,
		createdAt: new Date(orderDetails.create_time),
		expiresAt: new Date(new Date().setMonth(new Date().getMonth() + _months)),
		duration: months,
		email: orderDetails.payer.email_address ?? '',
		status: 'PAID',
	});

	await channel.save();

	return {
		months: _months,
		recepient: _recepient,
		expiresAt: new Date(new Date().setMonth(new Date().getMonth() + _months)),
	};
};

export default function Premium() {
	const [recepient, setRecepient] = useState('');
	const [checkout, setCheckout] = useState(false);
	const [months, setMonths] = useState(3);
	const [realMonths, setRealMonths] = useState(3);
	const { cid, channel, subscribed, expiresAt } = useLoaderData();
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
				.catch(() => setError('User not found'));
			// setCheckout(true);

			console.log(user);

			if (!user) return setError('User not found');

			if (user.premium.active == false) {
				setCheckout(true);
				setRealMonths(months);
			} else {
				return setError('User already has premium');
			}
		} else {
			const user: UserResponse | null = await fetch('/api/v3/user/' + channel.login)
				.then((res) => res.json())
				.catch(() => setError('User not found'));

			if (!user) return setError('User not found');
			if (user.premium.active == true) return setError('You already have premium');
			setCheckout(true);
			setRealMonths(months);
		}
	};

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

	return (
		<>
			{subscribed ? (
				<>
					<Title order={3}>You already have premium, thanks for your support!</Title>
					<Text>You can gift premium to other people below</Text>
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
						{/* 
						<Card.Section>
							<Text mb="xs" weight={500}>
								Premium Features:
							</Text>
							<Grid grow>
								<Grid.Col md={6} lg={3}>
									<Card>
										<Title order={4}>Feature Title</Title>
										<Text>Feature description will go here, describing what the feature does.</Text>
									</Card>
								</Grid.Col>
								<Grid.Col md={6} lg={3}>
									<Card>
										<Title order={4}>Feature Title</Title>
										<Text>Feature description will go here, describing what the feature does.</Text>
									</Card>
								</Grid.Col>
								<Grid.Col md={6} lg={3}>
									<Card>
										<Title order={4}>Feature Title</Title>
										<Text>Feature description will go here, describing what the feature does.</Text>
									</Card>
								</Grid.Col>
								<Grid.Col md={6} lg={3}>
									<Card>
										<Title order={4}>Feature Title</Title>
										<Text>Feature description will go here, describing what the feature does.</Text>
									</Card>
								</Grid.Col>
							</Grid>
						</Card.Section>
							*/}
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
				<Title order={2}>
					{`$${pricePoints[months]} USD`}{' '}
					{months > 4 && (
						<>
							<Badge size="md" variant="filled">
								Save {Math.round((100 * (4 * months - pricePoints[months])) / (4 * months))}%
							</Badge>
						</>
					)}
				</Title>
				<Text size="lg" mb="md">
					{months} month{months == 1 ? '' : 's'}
				</Text>

				<Checkbox
					label="Gift to another user"
					checked={gifting}
					onChange={(event) => {
						if (subscribed && !event.target.checked) return;
						setGifting(event.target.checked);
						setRecepient('');
					}}
				/>
				<Collapse in={gifting}>
					<TextInput
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
									${pricePoints[realMonths]} · {realMonths} month{realMonths == 1 ? '' : 's'}
								</strong>
							</Text>
							{console.log(channel)}
							<Text align="center">
								<Text
									variant="link"
									component="a"
									href={`https://twitch.tv/${gifting && recepient.length > 0 ? recepient : channel.login}`}
									target="_blank"
								>
									https://twitch.tv/{gifting && recepient.length > 0 ? recepient : channel.login}
								</Text>
							</Text>
							<PayPalScriptProvider
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
							</PayPalScriptProvider>
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
