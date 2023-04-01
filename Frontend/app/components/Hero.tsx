import { Button, Container, createStyles, Group, Image, List, Text, ThemeIcon, Title } from '@mantine/core';
import React from 'react';
import { Form } from '@remix-run/react';
import { Check } from 'tabler-icons-react';
import { OAuth2Profile } from '~/services/oauth.strategy';
import { IChannel } from 'common';

const useStyles = createStyles((theme) => ({
	inner: {
		display: 'flex',
		justifyContent: 'space-between',
		paddingTop: theme.spacing.xl * 4,
		paddingBottom: theme.spacing.xl * 4,
	},

	content: {
		maxWidth: 480,
		marginRight: theme.spacing.xl * 3,

		[theme.fn.smallerThan('md')]: {
			maxWidth: '100%',
			marginRight: 0,
		},
	},

	title: {
		color: theme.colorScheme === 'dark' ? theme.white : theme.black,
		fontFamily: `Greycliff CF, ${theme.fontFamily}`,
		fontSize: 44,
		lineHeight: 1.2,
		fontWeight: 900,

		[theme.fn.smallerThan('xs')]: {
			fontSize: 28,
		},
	},

	control: {
		backgroundColor: '#6441a5',
		':hover': {
			backgroundColor: '#593A93',
		},
		[theme.fn.smallerThan('xs')]: {
			flex: 1,
		},
	},

	image: {
		flex: 1,

		[theme.fn.smallerThan('md')]: {
			display: 'none',
		},
	},

	highlight: {
		position: 'relative',
		backgroundColor: theme.colorScheme === 'dark' ? theme.fn.rgba(theme.colors[theme.primaryColor][6], 0.55) : theme.colors[theme.primaryColor][0],
		borderRadius: theme.radius.sm,
		padding: '4px 12px',
	},
}));

interface Props {
	channel?: IChannel;
}

export function HeroBullets(props: Props) {
	const { classes } = useStyles();
	return (
		<div>
			<Container>
				<div className={classes.inner}>
					<div className={classes.content}>
						<Title className={classes.title}>OuraBot</Title>
						<Text color="dimmed" mt="md">
							A high-performance, feature-rich, and easy-to-use Twitch bot.
						</Text>

						<List
							mt={30}
							spacing="sm"
							size="sm"
							icon={
								<ThemeIcon size={20} radius="xl">
									<Check size={12} />
								</ThemeIcon>
							}
						>
							<List.Item>
								<b>Moderation tools</b> – Keep your chat clean and safe with our powerful moderation tools.
							</List.Item>
							<List.Item>
								<b>Fun commands</b> – Entertain your viewers with our fun commands that will allow them to express themselves in a fun way.
							</List.Item>
							<List.Item>
								<b>Easy-to-use</b> – Spend more time streaming and less time configuring your bot.
							</List.Item>
						</List>

						<Group mt={30}>
							{/* <button className="btn btn-primary bg-twitch_purple hover:bg-twitch_purple_light rounded-full text-white font-bold py-2 px-4">
								Signin with Twitch
							</button> */}
							{props.channel ? (
								<Form action="/dashboard">
									<Button type="submit">Dashboard</Button>
								</Form>
							) : (
								<Form action="/login">
									<Button
										type="submit"
										color="twitch"
										sx={{
											backgroundColor: '#6441a5',
											color: 'white',
											':hover': { backgroundColor: '#593A93' },
										}}
									>
										Sign in with Twitch
									</Button>
								</Form>
							)}
						</Group>
					</div>
					<Image src="/resources/Logo.png" className={classes.image} alt='OuraBot Logo - I am not a good artist' fit='contain' />
				</div>
			</Container>
		</div>
	);
}
