import { createStyles, Text, Container, ActionIcon, Group, Image } from '@mantine/core';
import emoji from 'react-easy-emoji';
import { BrandTwitter, BrandTwitch, Mail, Spy, ClipboardText, Shield } from 'tabler-icons-react';
import { OuraBotLogo } from '~/shared/Logo';

const useStyles = createStyles((theme) => ({
	footer: {
		marginTop: 120,
		paddingTop: theme.spacing.xl * 2,
		paddingBottom: theme.spacing.xl * 2,
		backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
		borderTop: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
	},

	logo: {
		maxWidth: 200,

		[theme.fn.smallerThan('sm')]: {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
		},
	},

	description: {
		marginTop: 5,

		[theme.fn.smallerThan('sm')]: {
			marginTop: theme.spacing.xs,
			textAlign: 'center',
		},
	},

	inner: {
		display: 'flex',
		justifyContent: 'space-between',

		[theme.fn.smallerThan('sm')]: {
			flexDirection: 'column',
			alignItems: 'center',
		},
	},

	groups: {
		display: 'flex',
		flexWrap: 'wrap',

		[theme.fn.smallerThan('sm')]: {
			display: 'none',
		},
	},

	wrapper: {
		width: 160,
	},

	link: {
		display: 'block',
		color: theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[6],
		fontSize: theme.fontSizes.sm,
		paddingTop: 3,
		paddingBottom: 3,

		'&:hover': {
			textDecoration: 'underline',
		},
	},

	title: {
		fontSize: theme.fontSizes.lg,
		fontWeight: 700,
		fontFamily: `Greycliff CF, ${theme.fontFamily}`,
		marginBottom: theme.spacing.xs / 2,
		color: theme.colorScheme === 'dark' ? theme.white : theme.black,
	},

	afterFooter: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: theme.spacing.xl,
		paddingTop: theme.spacing.xl,
		paddingBottom: theme.spacing.xl,
		borderTop: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2]}`,

		[theme.fn.smallerThan('sm')]: {
			flexDirection: 'column',
		},
	},

	social: {
		[theme.fn.smallerThan('sm')]: {
			marginTop: theme.spacing.xs,
		},
	},
}));

interface FooterLinksProps {
	data: {
		title: string;
		links: { label: string; link: string }[];
	}[];
}

export function FooterLinks() {
	const { classes } = useStyles();

	return (
		<footer className={classes.footer}>
			<Container className={classes.inner}>
				<div className={classes.logo}>
					<a href="/">
						<Image src="/resources/LogoText.png" fit="contain" width="90%" alt="OuraBot" />
					</a>
					<Text size="xs" color="dimmed" className={classes.description}>
						Made with {emoji('💙')} by Auro
					</Text>
				</div>
				<div className={classes.groups}></div>
			</Container>
			<Container className={classes.afterFooter}>
				<Text color="dimmed" size="sm">
					© 2023 OuraBot. All rights reserved. Not affiliated with Twitch
				</Text>

				<Group spacing={0} className={classes.social} position="right" noWrap>
					<ActionIcon title="Privacy Policy" size="lg" component="a" href="https://ourabot.com/privacy" target="_blank" rel="noreferrer">
						<Shield size={18} />
					</ActionIcon>
					<ActionIcon title="Terms of Service" size="lg" component="a" href="https://ourabot.com/tos" target="_blank" rel="noreferrer">
						<ClipboardText size={18} />
					</ActionIcon>
					<ActionIcon title="Twitter" size="lg" component="a" href="https://twitter.com/auror6s" target="_blank" rel="noreferrer">
						<BrandTwitter size={18} />
					</ActionIcon>
					<ActionIcon title="Twitch" size="lg" component="a" href="https://twitch.tv/oura_bot" target="_blank" rel="noreferrer">
						<BrandTwitch size={18} />
					</ActionIcon>
					<ActionIcon title="Email" size="lg" component="a" href="mailto:contact@ourabot.com" target="_blank" rel="noreferrer">
						<Mail size={18} />
					</ActionIcon>
				</Group>
			</Container>
		</footer>
	);
}
