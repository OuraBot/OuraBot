import { Alert, Text, Switch, Container } from '@mantine/core';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { Activity, AlertCircle, Checklist, Cloud, Settings, Users } from 'tabler-icons-react';
import BetaBanner from '~/components/BetaBanner';
import { FeaturesGrid } from '~/components/Features';
import { HeaderResponsive } from '~/components/Header';
import { HeroText } from '~/components/Hero';
import { FooterLinks } from '~/components/footer';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import type { TwitchSession } from '~/services/oauth.strategy';
import { redisConnect } from '~/services/redis.server';

export async function loader({ request }: LoaderArgs) {
	const session: TwitchSession = (await authenticator.isAuthenticated(request))?.json;

	const { pub, sub } = await redisConnect();

	const cached = await pub.get('obfrontend:status');

	let status: boolean;

	if (cached) {
		status = cached === 'true' ? true : false;
	} else {
		try {
			const data = await fetch('https://status.mrauro.dev/api/badge/2/status');
			const text = await data.text();
			if (text.includes('Up')) status = true;
			else status = false;

			await pub.set('obfrontend:status', status.toString(), 'EX', 60);
		} catch (e) {
			status = false;
		}
	}

	if (session) {
		const channel = await ChannelModel.findOne({ id: session.id });

		const subscribed = channel.premium.orders.some((order: any) => {
			return order.status === 'PAID' && order.expiresAt > new Date();
		});

		return {
			channel,
			online: status,
			session,
			subscribed,
		};
	} else {
		return {
			online: status,
		};
	}
}

export async function action({ request }: ActionArgs) {
	await authenticator.logout(request, { redirectTo: '/' });
}

export default function Index() {
	let { channel, online, session, subscribed } = useLoaderData();

	return (
		<>
			<BetaBanner />
			<HeaderResponsive channel={channel} session={session} premium={subscribed} />
			{online ? null : (
				<Container>
					<Alert icon={<AlertCircle size="1rem" />} title="Degraded Service" color="red" radius="md" variant="light" my="sm">
						OuraBot is offline due to a server outage. We are working on getting it back online as soon as possible. You can check the status of OuraBot{' '}
						<Text variant="link" component="a" href="https://status.mrauro.dev" target="_blank">
							here.
						</Text>
					</Alert>
				</Container>
			)}
			<HeroText channel={channel} />
			<FeaturesGrid
				title="Get started in seconds"
				description="Simply sign in with your Twitch account and you are ready to go."
				data={[
					{ title: 'Cloud Hosted', description: 'No downloads, simply sign in and you are ready to go.', icon: Cloud },
					{ title: 'Simple', description: 'No complicated setup, just a simple dashboard.', icon: Checklist },
					{ title: 'Configurable', description: 'Configure your bot to your liking.', icon: Settings },
					{ title: 'Community Driven', description: 'OuraBot is open source, and is driven by the community.', icon: Users },
				]}
			/>
			<FooterLinks />
		</>
	);
}
