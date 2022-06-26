import {
	AppShell,
	Avatar,
	Burger,
	Center,
	createStyles,
	Group,
	Header,
	Loader,
	MediaQuery,
	Menu,
	Navbar,
	Space,
	Title,
	useMantineTheme,
} from '@mantine/core';
import { useState } from 'react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '~/utils/redirect.server';
import { Form, Link, Outlet, useLoaderData, useLocation, useTransition } from '@remix-run/react';
import { BellRinging, LayoutGrid, Logout, Settings, SquaresFilled } from 'tabler-icons-react';
import { authenticator } from '~/services/auth.server';
import { _model as Channel } from '~/services/models/Channel';
import { OuraBotLogo } from '~/shared/Logo';

export let loader: LoaderFunction = async ({ request }) => {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const channel = await Channel.findOne({ id: session.json.id });

	if (!channel) {
		return redirect('/onboarding');
	}

	return {
		session,
		channel,
	};
};

export const action: ActionFunction = async ({ request }) => {
	await authenticator.logout(request, { redirectTo: '/' });
};

const useStyles = createStyles((theme, _params, getRef) => {
	const icon = getRef('icon');
	return {
		header: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			height: '100%',
		},

		footer: {
			paddingTop: theme.spacing.md,
			marginTop: theme.spacing.md,
			borderTop: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2]}`,
		},

		link: {
			...theme.fn.focusStyles(),
			display: 'flex',
			alignItems: 'center',
			textDecoration: 'none',
			fontSize: theme.fontSizes.sm,
			color: theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[7],
			padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
			borderRadius: theme.radius.sm,
			fontWeight: 500,

			'&:hover': {
				backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
				color: theme.colorScheme === 'dark' ? theme.white : theme.black,

				[`& .${icon}`]: {
					color: theme.colorScheme === 'dark' ? theme.white : theme.black,
				},
			},
		},

		linkIcon: {
			ref: icon,
			color: theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6],
			marginRight: theme.spacing.sm,
		},

		linkActive: {
			'&, &:hover': {
				backgroundColor:
					theme.colorScheme === 'dark'
						? theme.fn.rgba(theme.colors[theme.primaryColor][8], 0.25)
						: theme.colors[theme.primaryColor][0],
				color: theme.colorScheme === 'dark' ? theme.white : theme.colors[theme.primaryColor][7],
				[`& .${icon}`]: {
					color: theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 5 : 7],
				},
			},
		},
	};
});

const _data = [
	{ link: '/dashboard', label: 'Dashboard', icon: SquaresFilled },
	{ link: '/dashboard/commands', label: 'Commands', icon: LayoutGrid },
	{ link: '/dashboard/settings', label: 'Settings', icon: Settings },
	{
		link: '/dashboard/emoteevents',
		label: 'Emote Events',
		icon: BellRinging,
	},
];

export default function Dashboard() {
	let data = useLoaderData();
	const { classes, cx } = useStyles();
	const location = useLocation();
	const [active, setActive] = useState(_data[_data.findIndex(({ link }) => link === location.pathname)].label);
	const theme = useMantineTheme();
	const [opened, setOpened] = useState(false);

	const transition = useTransition();

	if (!data.session) {
		redirect('/login');
	}

	// // console.log(data);

	const links = _data.map((item) => (
		<Link
			className={cx(classes.link, {
				[classes.linkActive]: item.label === active,
			})}
			to={item.link}
			key={item.label}
			onClick={(event) => {
				setActive(item.label);
			}}
		>
			<item.icon className={classes.linkIcon} />
			<span>{item.label}</span>
		</Link>
	));

	return (
		<>
			<AppShell
				navbarOffsetBreakpoint="sm"
				asideOffsetBreakpoint="sm"
				fixed
				padding="md"
				navbar={
					<Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 250 }}>
						{links}
					</Navbar>
				}
				// TODO
				// footer={
				// 	<Footer height={70}>
				// 		<FooterSimple links={[{ label: 'Twitter', link: 'https://twitter.com/auror6s' }]} />
				// 	</Footer>
				// }
				header={
					<Header className={classes.header} height={60} p="md">
						<MediaQuery largerThan="sm" styles={{ display: 'none' }}>
							<Burger
								opened={opened}
								onClick={() => setOpened((o) => !o)}
								size="sm"
								color={theme.colors.gray[6]}
								mr="xl"
							/>
						</MediaQuery>
						<OuraBotLogo />
						<Group>
							<>
								{data ? (
									<Menu control={<Avatar src={data.session?.json.profile_image_url} radius="xl" />}>
										<Form method="post">
											<Menu.Item icon={<Logout size={18} />} type="submit">
												Logout
											</Menu.Item>
										</Form>
									</Menu>
								) : (
									<></>
								)}
							</>
						</Group>
					</Header>
				}
				styles={(theme) => ({
					main: {
						backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
					},
				})}
			>
				<Title order={1}>{active}</Title>
				<Space h="xs" />
				{transition.state === 'idle' ? (
					<Outlet />
				) : (
					<Center>
						{' '}
						<Loader />{' '}
					</Center>
				)}
			</AppShell>
		</>
	);
}
