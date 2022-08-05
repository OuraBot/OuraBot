import { Button, createStyles, Divider, Stack, Switch, Text, Title } from '@mantine/core';
import { Form, useLoaderData, useTransition } from '@remix-run/react';
import { ActionArgs, json, LoaderArgs } from '@remix-run/server-runtime';
import { ChannelModel } from 'common';
import { authenticator } from '~/services/auth.server';
import { query } from '~/services/redis.server';
import settings from './settings';

export async function loader({ request }: LoaderArgs) {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await ChannelModel.findOne({ id: session.json.id });

	const modules = await query('QUERY', 'Modules', channel.token, session.json.id);

	return json({
		session,
		channel,
		modules,
	});
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();

	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const channel = await ChannelModel.findOne({ id: session.json.id });

	const followadsEnabled = formData.get('followadsEnabled') === 'on' ? true : false;

	const change = await query('UPDATE', 'Modules', channel.token, session.json.id, {
		followads: {
			enabled: followadsEnabled,
		},
	});

	return change;
}

const useStyles = createStyles((theme) => ({
	prefix: {
		width: '15em',

		[`@media (max-width: ${theme.breakpoints.sm}px)`]: {
			width: '100%',
		},
	},
	clip: {
		width: '40em',

		[`@media (max-width: ${theme.breakpoints.md}px)`]: {
			width: '100%',
		},

		[`@media (max-width: ${theme.breakpoints.sm}px)`]: {
			width: '100%',
		},
	},
	button: {
		width: '5em',

		[`@media (max-width: ${theme.breakpoints.sm}px)`]: {
			width: '100%',
		},
	},
}));

export default function Modules() {
	const { classes } = useStyles();
	const transition = useTransition();
	const data = useLoaderData();

	return (
		<>
			<Stack>
				<Form method="post">
					<Title order={3}>Follow Ads</Title>
					<Text my={0}>Automatically ban bots who post advertisements for follower bots</Text>
					<div>
						<Switch defaultChecked={data.modules['followads'].enabled} name="followads-enabled" id="followads-enabled" label="Enabled" />
					</div>
					<Divider my="xs" />
					<Button className={classes.button} type="submit" loading={transition.state == 'submitting'}>
						Save
					</Button>
				</Form>
			</Stack>
		</>
	);
}
