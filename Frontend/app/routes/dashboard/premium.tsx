import { Badge, Button, Center, Checkbox, Collapse, Container, Group, Loader, Slider, Stack, Text, TextInput, Title, UnstyledButton } from '@mantine/core';
import { useState } from 'react';
import { useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useLoaderData } from '@remix-run/react';
import { LoaderFunction } from '@remix-run/node';
import { ArrowBackUp } from 'tabler-icons-react';

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
	const cid = process.env.PAYPAL_CLIENT_ID;
	return { cid };
};

export default function Premium() {
	const [gifting, setGifting] = useState(false);
	const [recepient, setRecepient] = useState('');
	const [checkout, setCheckout] = useState(false);
	const [months, setMonths] = useState(3);
	const { cid } = useLoaderData();

	return (
		<>
			<Collapse in={!checkout}>
				<Text>
					Hosting and maintaining this bot is unfortunately not free. You can support the developer by purchasing a <strong>non-recurring</strong> payment.
				</Text>
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
						setGifting(event.target.checked);
						setRecepient('');
					}}
				/>
				<Collapse in={gifting}>
					<TextInput label="Gift to" autoFocus placeholder="Username" value={recepient} onChange={(event) => setRecepient(event.target.value)} />
				</Collapse>
				<Button
					my="md"
					fullWidth
					onClick={() => {
						setCheckout(true);
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
									${pricePoints[months]} · {months} month{months == 1 ? '' : 's'}
								</strong>
							</Text>
							{gifting && (
								<Text align="center">
									Gifting to{' '}
									<Text variant="link" component="a" href={`https://twitch.tv/${recepient}`} target="_blank">
										{recepient}
									</Text>
								</Text>
							)}
							<PayPalScriptProvider
								options={{
									'client-id': cid,
									components: 'buttons',
									currency: 'USD',
								}}
							>
								<ButtonWrapper amount={pricePoints[months]} currency={currency} showSpinner={true} />
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
const ButtonWrapper = ({ amount, currency, showSpinner }: any) => {
	// usePayPalScriptReducer can be use only inside children of PayPalScriptProviders
	// This is the main reason to wrap the PayPalButtons in a new component
	const [{ options, isPending, isRejected }, dispatch] = usePayPalScriptReducer();

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
			{showSpinner && isPending && <Loader />}
			{showSpinner && isRejected && <Text>There was an error with PayPal. Please refresh the page and try again.</Text>}
			<div>
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
								// Your code here after create the order
								return orderId;
							});
					}}
					onApprove={function (data, actions) {
						if (!actions.order) throw new Error('order is undefined');
						return actions.order.capture().then(function () {
							console.log('Payment Complete!');
						});
					}}
				/>
			</div>
		</>
	);
};
