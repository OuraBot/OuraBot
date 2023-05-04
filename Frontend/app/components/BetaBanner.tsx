import { Text, Badge, Stack } from '@mantine/core';

export default function BetaBanner() {
	return (
		<Stack align="center">
			<Badge style={{ marginTop: '1rem' }} variant="light">
				<>
					OuraBot is still in beta. Please report any bugs to our{' '}
					<Text variant="link" component="a" href="https://discord.gg/ZHqpuszdaM" target="_blank">
						Discord
					</Text>
				</>
			</Badge>
		</Stack>
	);
}
