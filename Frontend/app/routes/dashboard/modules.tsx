import { Button, Card, Grid, Group, Text, Title } from '@mantine/core';
import { Prism } from '@mantine/prism';
import { useLoaderData } from '@remix-run/react';
import { LoaderArgs } from '@remix-run/server-runtime';
import { json } from 'remix-utils';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import { query } from '~/services/redis.server';

export async function loader({ request }: LoaderArgs) {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await ChannelModel.findOne({ id: session.json.id });

	const modules = await query('QUERY', 'Modules', channel.token, session.json.id);

	if (modules.status !== 200) throw new Error(`QUERY Modules returned error code ${modules.status}`);

	console.log(modules);

	return {
		session,
		channel,
		modules,
	};
}

export default function Modules() {
	const { modules } = useLoaderData();
	console.log(modules);

	return (
		<>
			<Prism withLineNumbers language="json">
				{JSON.stringify(modules, null, 2)}
			</Prism>
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
