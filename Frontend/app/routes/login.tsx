import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { LoginMenu } from '~/components/Login';
import { authenticator } from '~/services/auth.server';
import { sessionStorage } from '~/services/session.server';

export async function action({ request, context }: ActionArgs) {
	await authenticator.authenticate('oauth2', request, {
		successRedirect: '/onboarding',
		failureRedirect: '/login',
		throwOnError: true,
		context,
	});
}

export async function loader({ request }: LoaderArgs) {
	await authenticator.isAuthenticated(request, {
		successRedirect: '/onboarding',
	});

	const session = await sessionStorage.getSession(request.headers.get('Cookie'));

	const error = session.get('sessionErrorKey');
	return json<any>({ error });
}

export default function Login() {
	const loaderData = useLoaderData();

	return <LoginMenu />;
}
