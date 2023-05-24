import { Text } from '@mantine/core';

export default function Index() {
	return (
		<Text>
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
