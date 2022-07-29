import { LoaderFunction } from '@remix-run/server-runtime';
import { authenticator } from '../services/auth.server';

export const loader: LoaderFunction = async ({ params, request }) => {
	await authenticator.logout(request, { redirectTo: '/login' });
};
