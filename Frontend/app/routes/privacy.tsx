import { Button, Container, Text, Title } from '@mantine/core';
import { useLoaderData } from '@remix-run/react';
import { LoaderArgs } from '@remix-run/server-runtime';
import { HeaderResponsive } from '~/components/Header';
import { FooterLinks } from '~/components/footer';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import { TwitchSession } from '~/services/oauth.strategy';

export async function loader({ request }: LoaderArgs) {
	const session: TwitchSession = (await authenticator.isAuthenticated(request))?.json;

	if (session) {
		const channel = await ChannelModel.findOne({ id: session.id });
		return {
			channel,
			session,
		};
	} else {
		return {
			channel: null,
			session: null,
		};
	}
}

export default function TOS() {
	let { channel, session } = useLoaderData();

	return (
		<>
			<HeaderResponsive noMargin={true} channel={channel} session={session} />

			<Container m="lg">
				<Button size="sm" variant="light" component="a" href="/tos" mt="md">
					Go to Terms of Service
				</Button>
				<Title order={1}>Privacy Policy</Title>
				<Text ml="lg">
					Thank you for your interest in OuraBot, a Service operated by Auro ("we", "us", or "our"). We are committed to protecting the privacy of our users,
					and we take this responsibility seriously. If you have any questions or concerns, please contact us using the information provided at the end of this
					policy. This privacy policy applies to all information collected through our Site (https://ourabot.com), and other related use of the OuraBot Twitch
					Bot services.
				</Text>
				<Title order={3}>INFORMATION WE COLLECT</Title>
				<Text ml="lg">
					We automatically collect certain information when you create an account and use OuraBot. This information includes your Twitch username and ID, as
					well as any other information provided to us through Twitch.tv's API. We may also collect information about your interactions with the Site and
					OuraBot services, including IP address, device type, and browser type. We may also use other information from public databases and APIs that are
					required to provide our services.
				</Text>
				<Title order={3}>HOW WE USE YOUR INFORMATION</Title>
				<Text ml="lg">
					We only use your information for the purpose of providing and improving our services to you. Your information will not be shared or sold to third
					parties for any reason, except as required by law. We may share your information to provide service (including but not limited to the "subage"
					commands).
				</Text>
				<Title order={3}>OTHER SERVICES</Title>
				<Text ml="lg">
					We may share your Twitch ID with other services or APIs in order to provide integrated features or functionality. These third-party services may have
					their own Privacy Policies and we encourage you to review their policies before using those services.
				</Text>
				<Title order={3}>PRIVACY POLICY UPDATES</Title>
				<Text ml="lg">
					We reserve the right to modify this Privacy Policy at any time. You should check this page periodically to ensure you are aware of any changes.
				</Text>
				<Title order={3}>CONTACT INFORMATION</Title>
				<Text ml="lg">If you have any questions or concerns about our Privacy Policy, please contact us at contact@ourabot.com.</Text>
				<Button component="a" href="/" mt="md">
					Go Back
				</Button>
			</Container>
			<FooterLinks />
		</>
	);
}
