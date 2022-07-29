import { Switch } from '@mantine/core';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { Activity } from 'tabler-icons-react';
import { FeaturesGrid } from '~/components/Features';
import { FooterSimple } from '~/components/footer';
import { HeaderResponsive } from '~/components/Header';
import { HeroBullets } from '~/components/Hero';
import { authenticator } from '~/services/auth.server';
import { _model as Channel } from '~/services/models/Channel';
import type { TwitchSession } from '~/services/oauth.strategy';

export async function loader({ request }: LoaderArgs) {
	const session: TwitchSession = (await authenticator.isAuthenticated(request))?.json;
	if (session) {
		const channel = await Channel.findOne({ id: session.id });
		return channel;
	} else {
		return null;
	}
}

export async function action({ request }: ActionArgs) {
	await authenticator.logout(request, { redirectTo: '/' });
}

export default function Index() {
	let data = useLoaderData<typeof loader>();

	return (
		<>
			<HeaderResponsive links={[{ label: 'Features', link: '#features' }]} channel={data} />
			<HeroBullets channel={data} />
			<FeaturesGrid
				title="Title"
				description="Description"
				data={[
					{ title: 'Feature', description: 'Description', icon: Activity },
					{ title: 'Feature', description: 'Description', icon: Activity },
				]}
			/>
			<FooterSimple links={[{ label: 'Twitter', link: 'https://twitter.com/auror6s' }]} />
		</>
	);
}
