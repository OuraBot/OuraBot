import { useLoaderData } from '@remix-run/react';
import type { LoaderArgs, MetaFunction } from '@remix-run/server-runtime';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';

export async function loader({ request }: LoaderArgs) {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await ChannelModel.findOne({ id: session.json.id });

	return {
		session,
		channel,
	};
}

export const meta: MetaFunction = () => {
	return {
		title: 'Kick - OuraBot',
		description: 'Connect with Kick',
	};
};

export default function Modules() {
	const { channel } = useLoaderData();

	return (
		<>
			<div>Coming Soon</div>
			{/* <Prism withLineNumbers language="json">
				{JSON.stringify(channel, null, 2)}
			</Prism> */}
		</>
	);
}
