import Stripe from 'stripe';

let stripeApiKey = process.env.STRIPE_SECRET_KEY;

// console.log(process.env.NODE_ENV);

if (!stripeApiKey) console.warn('no stripe api key');
stripeApiKey = '';

export const stripe = new Stripe(stripeApiKey, {
	apiVersion: '2022-11-15',
});

export async function purchasePremium(quantity: number, user_db_id: string, metadata: any = {}) {
	console.log('purchasePremium for user_db_id: ', user_db_id.toString(), ' with quantity: ', quantity);

	const session = await stripe.checkout.sessions.create({
		line_items: [
			{
				// Provide the exact Price ID (for example, pr_1234) of the product you want to sell
				// price: 'price_1NSo5LHnGV3PiW2e9TUCruxg',
				price: 'price_1NajOzHnGV3PiW2esbD6c2tv',
				quantity,
			},
		],
		metadata: {
			user_db_id: user_db_id.toString(),
			...metadata,
		},
		mode: 'payment',
		success_url: `https://ourabot.com/dashboard/premium/success?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `https://ourabot.com/dashboard/premium/cancel`,
		automatic_tax: { enabled: true },
	});

	return {
		id: session.id,
		url: session.url,
	};
}
