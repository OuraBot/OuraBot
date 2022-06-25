import { Avatar, Burger, Container, createStyles, Group, Header, Menu, Paper, Transition } from '@mantine/core';
import { useBooleanToggle } from '@mantine/hooks';
import React, { useState } from 'react';
import type { ActionFunction } from '@remix-run/node';
import { Form } from '@remix-run/react';
import { Dashboard, Logout } from 'tabler-icons-react';
import { authenticator } from '~/services/auth.server';
import type { OAuth2Profile } from '~/services/oauth.strategy';
import { OuraBotLogo } from '../shared/Logo';

const HEADER_HEIGHT = 60;

export const action: ActionFunction = async ({ request }) => {
	await authenticator.logout(request, { redirectTo: '/login' });
};
const useStyles = createStyles((theme) => ({
	root: {
		position: 'relative',
		zIndex: 1,
	},

	dropdown: {
		position: 'absolute',
		top: HEADER_HEIGHT,
		left: 0,
		right: 0,
		zIndex: 0,
		borderTopRightRadius: 0,
		borderTopLeftRadius: 0,
		borderTopWidth: 0,
		overflow: 'hidden',

		[theme.fn.largerThan('sm')]: {
			display: 'none',
		},
	},

	header: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		height: '100%',
	},

	links: {
		[theme.fn.smallerThan('sm')]: {
			display: 'none',
		},
	},

	burger: {
		[theme.fn.largerThan('sm')]: {
			display: 'none',
		},
	},

	link: {
		display: 'block',
		lineHeight: 1,
		padding: '8px 12px',
		borderRadius: theme.radius.sm,
		textDecoration: 'none',
		color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],
		fontSize: theme.fontSizes.sm,
		fontWeight: 500,

		'&:hover': {
			backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
		},

		[theme.fn.smallerThan('sm')]: {
			borderRadius: 0,
			padding: theme.spacing.md,
		},
	},

	linkActive: {
		'&, &:hover': {
			backgroundColor:
				theme.colorScheme === 'dark'
					? theme.fn.rgba(theme.colors[theme.primaryColor][9], 0.25)
					: theme.colors[theme.primaryColor][0],
			color: theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 3 : 7],
		},
	},
}));

interface HeaderResponsiveProps {
	links: { link: string; label: string }[];
	session: OAuth2Profile | null;
}

export function HeaderResponsive({ links, session }: HeaderResponsiveProps) {
	const [opened, toggleOpened] = useBooleanToggle(false);
	const [active, setActive] = useState(links[0].link);
	const { classes, cx } = useStyles();

	const items = links.map((link) => (
		<a
			key={link.label}
			href={link.link}
			className={cx(classes.link, { [classes.linkActive]: active === link.link })}
			onClick={(event) => {
				event.preventDefault();
				setActive(link.link);
				toggleOpened(false);
			}}
		>
			{link.label}
		</a>
	));

	return (
		<Header height={HEADER_HEIGHT} mb={120} className={classes.root}>
			<Container className={classes.header}>
				<OuraBotLogo />
				<Group spacing={5} className={classes.links}>
					{items}
					{session ? (
						<Menu control={<Avatar src={session?.json.profile_image_url} radius="xl" />}>
							<Form method="post">
								<a href="/dashboard">
									<Menu.Item icon={<Dashboard size={18} />}>Dashboard</Menu.Item>
								</a>
								<Menu.Item icon={<Logout size={18} />} type="submit">
									Logout
								</Menu.Item>
							</Form>
						</Menu>
					) : (
						<></>
					)}
				</Group>

				<Burger opened={opened} onClick={() => toggleOpened()} className={classes.burger} size="sm" />

				<Transition transition="pop-top-right" duration={200} mounted={opened}>
					{(styles) => (
						<Paper className={classes.dropdown} withBorder style={styles}>
							{items}
						</Paper>
					)}
				</Transition>
			</Container>
		</Header>
	);
}
