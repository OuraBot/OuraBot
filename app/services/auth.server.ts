import { sessionStorage } from '~/services/session.server';
import { Authenticator } from 'remix-auth';
import { OAuth2Strategy } from './oauth.strategy';

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export let authenticator = new Authenticator<any>(sessionStorage, {
	sessionKey: 'sessionKey',
	sessionErrorKey: 'sessionErrorKey',
});

// Twitch
authenticator.use(
	new OAuth2Strategy(
		{
			authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
			tokenURL: 'https://id.twitch.tv/oauth2/token',
			callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/auth/twitch/callback',
			clientID: process.env.CLIENT_ID || '',
			clientSecret: process.env.CLIENT_SECRET || 'secret',
		},
		async ({ accessToken, refreshToken, extraParams, profile, context }) => {
			return await Promise.resolve({ ...profile });
		}
	)
	// new FormStrategy(async ({ form }) => {
	// 	// get the data from the form...
	// 	let email = form.get('email') as string;
	// 	let password = form.get('password') as string;

	// 	// initiialize the user here
	// 	let user = null;

	// 	// do some validation, errors are in the sessionErrorKey
	// 	if (!email || email?.length === 0) throw new AuthorizationError('Bad Credentials: Email is required');
	// 	if (typeof email !== 'string') throw new AuthorizationError('Bad Credentials: Email must be a string');

	// 	if (!password || password?.length === 0) throw new AuthorizationError('Bad Credentials: Password is required');
	// 	if (typeof password !== 'string') throw new AuthorizationError('Bad Credentials: Password must be a string');

	// 	// login the user, this could be whatever process you want
	// 	if (email === 'aaron@mail.com' && password === 'password') {
	// 		user = {
	// 			name: email,
	// 			token: `${password}-${new Date().getTime()}`,
	// 		};

	// 		// the type of this user must match the type you pass to the Authenticator
	// 		// the strategy will automatically inherit the type if you instantiate
	// 		// directly inside the `use` method
	// 		return await Promise.resolve({ ...user });
	// 	} else {
	// 		// if problem with user throw error AuthorizationError
	// 		throw new AuthorizationError('Bad Credentials');
	// 	}
	// })
);
