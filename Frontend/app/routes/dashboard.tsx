import {
	AppShell,
	Avatar,
	Burger,
	Center,
	Group,
	Header,
	Image,
	Loader,
	MediaQuery,
	Menu,
	Navbar,
	Space,
	Title,
	UnstyledButton,
	createStyles,
	useMantineTheme,
} from '@mantine/core';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, Link, Outlet, PrefetchPageLinks, useLoaderData, useLocation, useTransition } from '@remix-run/react';
import { useState } from 'react';
import { Category, Friends, LayoutGrid, Logout, Settings, Shield, SquaresFilled, Star } from 'tabler-icons-react';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import { redirect } from '~/utils/redirect.server';

export async function loader({ request }: LoaderArgs) {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const channel = await ChannelModel.findOne({ id: session.json.id });

	if (!channel) {
		return redirect('/onboarding');
	}

	return json({
		session,
		channel,
	});
}

export async function action({ request }: ActionArgs) {
	await authenticator.logout(request, { redirectTo: '/' });
}

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
				backgroundColor: theme.colorScheme === 'dark' ? theme.fn.rgba(theme.colors[theme.primaryColor][8], 0.25) : theme.colors[theme.primaryColor][0],
				color: theme.colorScheme === 'dark' ? theme.white : theme.colors[theme.primaryColor][7],
				[`& .${icon}`]: {
					color: theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 5 : 7],
				},
			},
			cursor: 'pointer',
		},

		admin: {
			color: theme.colors.blue[6],

			'&:hover': {
				color: theme.colors.blue[3],

				[`& .${icon}`]: {
					color: theme.colors.blue[3],
				},
			},
		},

		adminIcon: {
			ref: icon,
			color: theme.colors.blue[6],
			marginRight: theme.spacing.sm,
		},

		subscribe: {
			color: theme.colors.yellow[6],

			'&:hover': {
				color: theme.colors.yellow[3],
			},
		},

		subscribeIcon: {
			ref: icon,
			color: theme.colors.yellow[6],
			marginRight: theme.spacing.sm,
		},

		subscribeActive: {
			'&, &:hover': {
				backgroundColor: theme.fn.rgba(theme.colors.yellow[8], 0.2),
				color: theme.colors.yellow[7],
				[`& .${icon}`]: {
					color: theme.colors.yellow[5],
				},
			},
		},

		kick: {
			color: '#53fc18',

			'&:hover': {
				color: '#3ad305',
			},
		},

		kickIcon: {
			ref: icon,
			color: '#53fc18',
			marginRight: theme.spacing.sm,
		},

		kickActive: {
			'&, &:hover': {
				backgroundColor: theme.fn.rgba('#53fc18', 0.2),
				color: '#3ad305',
				[`& .${icon}`]: {
					color: '#3ad305',
				},
			},
		},
	};
});

function KickIcon({ size = 24, color = 'currentColor', ...restProps }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			className="icon icon-tabler icon-tabler-123"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			stroke={color}
			strokeWidth="2"
			fill="none"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...restProps}
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
			<path d="M4 4h5v4h3v-2h2v-2h6v4h-2v2h-2v4h2v2h2v4h-6v-2h-2v-2h-3v4h-5z"></path>
		</svg>
	);
}

const _data = [
	{ link: '/dashboard', label: 'Dashboard', icon: SquaresFilled },
	{ link: '/dashboard/commands', label: 'Commands', icon: LayoutGrid },
	{ link: '/dashboard/settings', label: 'Settings', icon: Settings },
	{ link: '/dashboard/suggest', label: 'Suggest', icon: Friends },
	{ link: '/dashboard/modules', label: 'Modules', icon: Category, kick: false, special: false },
	// { link: '/dashboard/kick', label: 'Kick', icon: KickIcon, kick: true },

	// { link: '/dashboard/phrases', label: 'Phrases', icon: MessageCircle2 }, // TODO
	// {
	// 	link: '/dashboard/premium',
	// 	label: 'Premium',
	// 	icon: Star,
	// 	special: true,
	// },
	{
		link: '/admin',
		label: 'Admin Dashboard',
		icon: Shield,
		admin: true,
	},
];

export default function Dashboard() {
	let data = useLoaderData<typeof loader>();
	const { classes, cx } = useStyles();
	const location = useLocation();
	const [active, setActive] = useState(_data[_data.findIndex(({ link }) => link === location.pathname.replace(/\/$/, ''))]?.label);
	const theme = useMantineTheme();
	const [opened, setOpened] = useState(false);

	const transition = useTransition();

	if (!data.session) {
		redirect('/login');
	}

	const links: React.ReactNode[] = [];
	const prefetchLinks: string[] = [];

	_data.forEach((item) => {
		if (!item?.admin) item.admin = false;

		if (item.admin && data.channel.role == 1) {
			links.push(
				<Link
					className={cx(classes.link, {
						[classes.linkActive]: item?.label === active,
						[classes.admin]: item.admin,
					})}
					to={item.link}
					key={item?.label}
					onClick={(event) => {
						setActive(item?.label);
					}}
				>
					<item.icon className={classes.adminIcon} />
					<span>{item?.label}</span>
				</Link>
			);
		} else if (!item.admin) {
			if (item?.label !== active) {
				// prefetchLinks.push(item.link);
				links.push(
					<Link
						className={cx(classes.link, {
							[classes.linkActive]: item?.label === active,
							[classes.subscribe]: item.special,
							[classes.subscribeActive]: item.special && item?.label === active,
							[classes.kick]: item.kick,
							[classes.kickActive]: item.kick && item?.label === active,
						})}
						to={item.link}
						key={item?.label}
						onClick={(event) => {
							setActive(item?.label);
						}}
					>
						<item.icon
							className={cx(classes.linkIcon, {
								[classes.subscribeIcon]: item.special,
								[classes.kickIcon]: item.kick,
							})}
						/>
						<span>{item?.label}</span>
					</Link>
				);
			} else {
				links.push(
					<div
						className={cx(classes.link, {
							[classes.linkActive]: item?.label === active,
							[classes.subscribe]: item.special,
							[classes.subscribeActive]: item.special && item?.label === active,
							[classes.kick]: item.kick,
							[classes.kickActive]: item.kick && item?.label === active,
						})}
						key={item?.label}
					>
						<item.icon
							className={cx(classes.linkIcon, {
								[classes.subscribeIcon]: item.special,
								[classes.kickIcon]: item.kick,
							})}
						/>
						<span>{item?.label}</span>
					</div>
				);
			}
		}
	});

	return (
		<>
			{/* {prefetchLinks.map((link) => (
				<PrefetchPageLinks page={link} key={link} />
			))} */}

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
							<Burger opened={opened} onClick={() => setOpened((o) => !o)} size="sm" color={theme.colors.gray[6]} mr="xl" />
						</MediaQuery>
						<a href="/">
							<Image src="/resources/LogoText.png" fit="contain" width="12rem" alt="OuraBot" />
						</a>

						<Group>
							<>
								{data ? (
									<Menu position="bottom-end">
										<Menu.Target>
											<UnstyledButton>
												<Avatar src={data.session?.json.profile_image_url} radius="xl" />
											</UnstyledButton>
										</Menu.Target>

										<Menu.Dropdown>
											<Form method="post">
												<Menu.Item icon={<Logout size={18} />} component={Link} to="/logout">
													Logout
												</Menu.Item>
											</Form>
										</Menu.Dropdown>
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
