import { createStyles, Title, Text, Button, Container } from '@mantine/core';
import { Dots } from './Dots';

const useStyles = createStyles((theme) => ({
	wrapper: {
		position: 'relative',
		paddingTop: 120,
		paddingBottom: 80,

		[theme.fn.smallerThan('sm')]: {
			paddingTop: 80,
			paddingBottom: 60,
		},
	},

	inner: {
		position: 'relative',
		zIndex: 1,
	},

	dots: {
		position: 'absolute',
		color: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],

		[theme.fn.smallerThan('sm')]: {
			display: 'none',
		},
	},

	dotsLeft: {
		left: 0,
		top: 0,
	},

	title: {
		textAlign: 'center',
		fontWeight: 800,
		fontSize: 40,
		letterSpacing: -1,
		color: theme.colorScheme === 'dark' ? theme.white : theme.black,
		marginBottom: theme.spacing.xs,
		fontFamily: `Greycliff CF, ${theme.fontFamily}`,

		[theme.fn.smallerThan('xs')]: {
			fontSize: 28,
			textAlign: 'left',
		},
	},

	highlight: {
		color: theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6],
	},

	description: {
		textAlign: 'center',

		[theme.fn.smallerThan('xs')]: {
			textAlign: 'left',
			fontSize: theme.fontSizes.md,
		},
	},

	controls: {
		marginTop: theme.spacing.lg,
		display: 'flex',
		justifyContent: 'center',

		[theme.fn.smallerThan('xs')]: {
			flexDirection: 'column',
		},
	},

	control: {
		'&:not(:first-of-type)': {
			marginLeft: theme.spacing.md,
		},

		[theme.fn.smallerThan('xs')]: {
			height: 42,
			fontSize: theme.fontSizes.md,

			'&:not(:first-of-type)': {
				marginTop: theme.spacing.md,
				marginLeft: 0,
			},
		},
	},
}));

interface Props {
	channel?: string;
}

export function HeroText(props: Props) {
	const { classes } = useStyles();

	return (
		<Container className={classes.wrapper} size={1400}>
			<Dots className={classes.dots} style={{ left: 0, top: 0 }} />
			<Dots className={classes.dots} style={{ left: 60, top: 0 }} />
			<Dots className={classes.dots} style={{ left: 0, top: 140 }} />
			<Dots className={classes.dots} style={{ right: 0, top: 60 }} />

			<div className={classes.inner}>
				<Title className={classes.title}>
					A powerful and{' '}
					<Text component="span" className={classes.highlight} inherit>
						free
					</Text>{' '}
					Twitch chat bot
				</Title>

				<Container p={0} size={600}>
					<Text size="lg" color="dimmed" className={classes.description}>
						Enhance your Twitch stream with our powerful and feature-packed bot, offering robust moderation tools and engaging community features.
					</Text>
				</Container>

				<div className={classes.controls}>
					{props.channel ? (
						<Button component="a" href="/dashboard" className={classes.control} size="lg">
							Open dashboard
						</Button>
					) : (
						<Button component="a" href="/login" className={classes.control} size="lg" variant="gradient" color="blue">
							Login with Twitch
						</Button>
					)}
					{/* <Button className={classes.control} size="lg" variant="default" color="gray">
						What does it do?
					</Button> */}
				</div>
			</div>
		</Container>
	);
}
