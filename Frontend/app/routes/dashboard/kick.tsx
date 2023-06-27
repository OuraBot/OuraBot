import { Button, Card, Divider, Grid, Group, NumberInput, Switch, Text, Title } from '@mantine/core';
import { Form, useLoaderData } from '@remix-run/react';
import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/server-runtime';
import { useState } from 'react';
import { InfoCircle } from 'tabler-icons-react';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import { query } from '~/services/redis.server';
import { inBounds } from './commands';

export async function loader({ request }: LoaderArgs) {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await ChannelModel.findOne({ id: session.json.id });

	return {
		session,
		channel,
	};
}

export const meta: MetaFunction = () => {
	return {
		title: 'Kick - OuraBot',
		description: 'Connect with Kick',
	};
};

export default function Modules() {
	const { channel } = useLoaderData();

	return (
		<>
			<div>Coming Soon</div>
			{/* <Prism withLineNumbers language="json">
				{JSON.stringify(channel, null, 2)}
			</Prism> */}
		</>
	);
}
