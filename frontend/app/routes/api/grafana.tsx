import { LoaderArgs, json } from '@remix-run/server-runtime';

export async function loader({ request }: LoaderArgs) {
	// check for auth header
	const authHeader = request.headers.get('Authorization');
	if (!authHeader) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (authHeader == '9lr2j36kQ+oSGmY0tEewOl+B7XNWA35lY0v+fXyTvr4=') {
		return json({});
	} else {
		return json({ error: 'Forbidden' }, { status: 403 });
	}
}
