import { Button, Card, Grid, Group, Text, Title } from '@mantine/core';

export default function Modules() {
	return (
		<>
			<Grid>
				<DemoCard />
				<DemoCard />
				<DemoCard />
				<DemoCard />
			</Grid>
		</>
	);
}

function DemoCard() {
	return (
		<>
			<Grid.Col md={6} lg={3}>
				<Card shadow="sm" p="lg" radius="md" withBorder>
					<Group position="apart" mb="xs">
						<Title order={3}>Module Name</Title>
					</Group>

					<Text size="sm">
						Module description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer viverra lorem quis pharetra accumsan. Vestibulum ante ipsum
						primis in faucibus orci luctus et ultrices posuere cubilia curae
					</Text>

					<Button variant="light" color="blue" fullWidth mt="md" radius="md">
						Book classic tour now
					</Button>
				</Card>
			</Grid.Col>
		</>
	);
}
