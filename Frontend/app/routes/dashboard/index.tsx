import { Alert, Center, Container, Text } from '@mantine/core';
import { useLoaderData } from '@remix-run/react';
import { LoaderArgs, json } from '@remix-run/server-runtime';
import { redisConnect } from '~/services/redis.server';
import { AlertCircle } from 'tabler-icons-react';

export async function loader({ params }: LoaderArgs) {
	const { pub, sub } = await redisConnect();

	const cached = await pub.get('obfrontend:status');

	if (cached) {
		return json(JSON.parse(cached));
	} else {
		const status = await fetch('https://status.mrauro.dev/api/badge/2/status');
		const data = await status.text();
		const statusText = data?.match(/(?<=aria-label="Status: )\w+/)![0];
		const online = statusText === 'Up' ? true : false;
		const returnData = {
			online,
		};

		await pub.set('obfrontend:status', JSON.stringify(returnData), 'EX', 30);

		return json(returnData);
	}
}

export default function Index() {
	const { online } = useLoaderData();

	return (
		<Text>
			{!online ? null : (
				<Alert icon={<AlertCircle size="1rem" />} title="Degraded Service" color="red" radius="md" variant="light" my="sm">
					OuraBot is offline due to a server outage. We are working on getting it back online as soon as possible. You can check the status of OuraBot{' '}
					<Text variant="link" component="a" href="https://status.mrauro.dev" target="_blank">
						here.
					</Text>
				</Alert>
			)}
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
