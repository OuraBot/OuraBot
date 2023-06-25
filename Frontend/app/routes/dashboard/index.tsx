import { Alert, Center, Container, List, Text } from '@mantine/core';
import { useLoaderData } from '@remix-run/react';
import { LoaderArgs, MetaFunction, json } from '@remix-run/server-runtime';
import { redisConnect } from '~/services/redis.server';
import { AlertCircle, AlertTriangle } from 'tabler-icons-react';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';

export async function loader({ request }: LoaderArgs) {
	const { pub, sub } = await redisConnect();
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await ChannelModel.findOne({ id: session.json.id });

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

	return {
		online: status,
		channel,
	};
}

export const meta: MetaFunction = () => {
	return {
		title: 'Dashboard - OuraBot',
		description: 'Dashboard',
	};
};

export default function Index() {
	const { online, channel } = useLoaderData();

	return (
		<Text>
			{online ? null : (
				<Alert icon={<AlertCircle size="1rem" />} title="Degraded Service" color="red" radius="md" variant="light" my="sm">
					OuraBot is offline due to a server outage. We are working on getting it back online as soon as possible. You can check the status of OuraBot{' '}
					<Text variant="link" component="a" href="https://status.mrauro.dev" target="_blank">
						here.
					</Text>
				</Alert>
			)}
			{channel.alerts.length > 0 ? (
				<Alert icon={<AlertTriangle size="1rem" />} title="Alerts" color="orange" radius="md" variant="light" my="sm">
					You have some alerts that may be preventing OuraBot from working properly:
					<List withPadding size="sm">
						{channel.alerts.map((alert: string) => (
							<List.Item key={Math.random()}>{alert}</List.Item>
						))}
					</List>
				</Alert>
			) : null}
			OuraBot is still in beta. Please report any bugs to our{' '}
			<Text variant="link" component="a" href="https://discord.gg/ZHqpuszdaM" target="_blank">
				Discord.
			</Text>{' '}
			You can check the status of OuraBot{' '}
			<Text variant="link" component="a" href="https://status.mrauro.dev" target="_blank">
				here.
			</Text>
		</Text>
	);
}
