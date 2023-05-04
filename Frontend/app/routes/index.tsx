import { Switch } from '@mantine/core';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { Activity, Checklist, Cloud, Settings } from 'tabler-icons-react';
import BetaBanner from '~/components/BetaBanner';
import { FeaturesGrid } from '~/components/Features';
import { HeaderResponsive } from '~/components/Header';
import { HeroBullets } from '~/components/Hero';
import { FooterLinks } from '~/components/footer';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import type { TwitchSession } from '~/services/oauth.strategy';

export async function loader({ request }: LoaderArgs) {
	const session: TwitchSession = (await authenticator.isAuthenticated(request))?.json;
	if (session) {
		const channel = await ChannelModel.findOne({ id: session.id });
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
			<BetaBanner />
			<HeaderResponsive channel={data} />
			<HeroBullets channel={data} />
			<FeaturesGrid
				title="Get started in seconds"
				description="Simply sign in with your Twitch account and you are ready to go."
				data={[
					{ title: 'Cloud Hosted', description: 'No downloads, simply sign in and you are ready to go.', icon: Cloud },
					{ title: 'Simple', description: 'No complicated setup, just a simple dashboard.', icon: Checklist },
					{ title: 'Configurable', description: 'Configure your bot to your liking.', icon: Settings },
				]}
			/>
			<FooterLinks />
		</>
	);
}
