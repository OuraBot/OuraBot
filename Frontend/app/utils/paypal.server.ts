import { AES, enc } from 'crypto-js';
import { redisConnect } from '~/services/redis.server';

export async function getAccessToken(): Promise<string> {
	const { pub } = await redisConnect();

	// We cache the access token for the expires_in time as to not make too many requests
	const cached_token = await pub.get('obv3:paypal:access_token');
	if (cached_token) {
		// The cached token is encrypted with our JWT key, so we need to decrypt it
		const decryptedBytes = AES.decrypt(cached_token, process.env.JWT_SECRET as string);
		const decryptedToken = decryptedBytes.toString(enc.Utf8);
		return decryptedToken;
	}

	const data: PayPalOAuthResponse = await new Promise((resolve, reject) => {
		const request = fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
			method: 'POST',
			body: 'grant_type=client_credentials',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				// Creating a buffer from the PayPal client id and secret is how the -u flag works in cURL
				Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
			},
		}).then((res) => res.json());

		request
			.then((data) => {
				resolve(data);
			})
			.catch((err) => {
				reject(err);
			});
	});

	const { access_token, expires_in } = data;

	console.table(data);

	// Encrypt and cache the access token
	const encryptedToken = AES.encrypt(access_token, process.env.JWT_SECRET as string);
	await pub.set('obv3:paypal:access_token', encryptedToken.toString(), 'EX', expires_in);

	return access_token;
}

export async function getOrderDetails(order_id: string): Promise<PayPalOrder> {
	const access_token = await getAccessToken();

	const data: PayPalOrder = await new Promise((resolve, reject) => {
		const request = fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${order_id}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		}).then((res) => res.json());

		request
			.then((data) => {
				resolve(data);
			})
			.catch((err) => {
				reject(err);
			});
	});

	return data;
}

type PayPalOAuthResponse = {
	scope: string;
	access_token: string;
	token_type: string;
	app_id: string;
	expires_in: number;
	nonce: string;
};

type PayPalOrder = {
	id: string;
	status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
	intent: 'CAPTURE' | 'AUTHORIZE';
	create_time: string;
	purchase_units: {
		reference_id: string;
		amount: any;
		payee: any;
		description: string;
		custom_id: string;
		paypemtns: any;
	}[];
	payer: {
		name: {
			given_name?: string;
			surname?: string;
		};
		email_address?: string;
		payer_id?: string;
		address?: {
			country_code: string;
		};
	};
};
