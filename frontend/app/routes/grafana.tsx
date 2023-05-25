import { LoaderFunction, json } from '@remix-run/server-runtime';

export const loader: LoaderFunction = async ({ params, request }) => {
	const auth = request.headers.get('Authorization');
	if (!auth) throw new Response('missing auth', { status: 401 });

	if (auth !== '9lr2j36kQ+oSGmY0tEewOl+B7XNWA35lY0v+fXyTvr4=') throw new Response('forbidden', { status: 403 });

	return json('success');
};
