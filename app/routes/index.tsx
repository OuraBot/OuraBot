import { Switch } from '@mantine/core';
import { ActionFunction, LoaderFunction } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { Activity } from 'tabler-icons-react';
import { FeaturesGrid } from '~/components/Features';
import { FooterSimple } from '~/components/Footer';
import { _model as Channel } from '~/services/models/Channel';
import { HeaderResponsive } from '~/components/Header';
import { HeroBullets } from '~/components/Hero';
import { authenticator } from '~/services/auth.server';
import { TwitchSession } from '~/services/oauth.strategy';

export let loader: LoaderFunction = async ({ request }) => {
	const session: TwitchSession = (await authenticator.isAuthenticated(request))?.json;
	if (session) {
		const channel = await Channel.findOne({ id: session.id });
		return channel;
	} else {
		return null;
	}
};

export const action: ActionFunction = async ({ request }) => {
	await authenticator.logout(request, { redirectTo: '/' });
};

export default function Index() {
	let data = useLoaderData();

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
			<Form method="post">
				<button>Logout</button>
			</Form>
			<p>{JSON.stringify(data)}</p>
			<Switch>Switch</Switch>
			<FooterSimple links={[{ label: 'Twitter', link: 'https://twitter.com/auror6s' }]} />
		</>
	);
}
