import { createCookieSessionStorage } from '@remix-run/node';

if (!process.env.JWT_SECRET) console.warn('JWT_SECRET is not set, falling back to "secret"');

// export the whole sessionStorage object
export let sessionStorage = createCookieSessionStorage({
	cookie: {
		name: '_session', // use any name you want here
		sameSite: 'lax', // this helps with CSRF
		path: '/', // remember to add this so the cookie will work in all routes
		httpOnly: true, // for security reasons, make this cookie http only
		secrets: [process.env.JWT_SECRET || 'secret'],
		secure: process.env.NODE_ENV === 'production', // enable this in prod only
	},
});

// you can also export the methods individually for your own usage
export let { getSession, commitSession, destroySession } = sessionStorage;
