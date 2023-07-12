import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
	apiVersion: '2022-11-15',
});

export async function purchasePremium(quantity: number, user_db_id: string) {
	console.log('purchasePremium for user_db_id: ', user_db_id.toString(), ' with quantity: ', quantity);

	const session = await stripe.checkout.sessions.create({
		line_items: [
			{
				// Provide the exact Price ID (for example, pr_1234) of the product you want to sell
				price: 'price_1NSo5LHnGV3PiW2e9TUCruxg',
				quantity,
			},
		],
		metadata: {
			user_db_id: user_db_id.toString(),
		},
		mode: 'payment',
		success_url: `http://localhost:3000/dashboard/premium/success?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `http://localhost:3000/dashboard/premium/cancel`,
		automatic_tax: { enabled: true },
	});

	return {
		id: session.id,
		url: session.url,
	};
}
