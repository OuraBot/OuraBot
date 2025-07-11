import { Avatar, Container, Group, Header, Image, Menu, UnstyledButton, createStyles } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Form } from '@remix-run/react';
import { Link } from 'react-router-dom';
import { Dashboard, Logout, Shield } from 'tabler-icons-react';
import { IChannel } from '../../../Common';

const HEADER_HEIGHT = 60;

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
			backgroundColor: theme.colorScheme === 'dark' ? theme.fn.rgba(theme.colors[theme.primaryColor][9], 0.25) : theme.colors[theme.primaryColor][0],
			color: theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 3 : 7],
		},
	},
}));

interface HeaderResponsiveProps {
	channel?: IChannel | null;
	session?: any;
	noMargin?: boolean;
	premium?: boolean;
}

export function HeaderResponsive(props: HeaderResponsiveProps) {
	const [opened, { toggle }] = useDisclosure(false);
	const { classes, cx } = useStyles();

	return (
		<Header height={HEADER_HEIGHT} mb={props.noMargin ? 10 : 120} className={classes.root}>
			<Container className={classes.header}>
				<a href="/">
					<Image src="/resources/LogoText.png" fit="contain" width="45%" alt="OuraBot" />
				</a>
				<Group spacing={5} className={classes.links}>
					{props?.channel && (
						<Menu>
							<Menu.Target>
								<UnstyledButton>
									<Avatar
										src={props.session.profile_image_url}
										radius="xl"
										style={{
											outline: 'groove',
											outlineColor: props.premium ? '#ffaa00' : 'transparent',
											outlineOffset: '2px',
											outlineWidth: '2px',
										}}
									/>
								</UnstyledButton>
							</Menu.Target>
							<Menu.Dropdown>
								<Form method="post">
									{props.channel.role == 1 ? (
										<Menu.Item icon={<Shield size={18} />} component={Link} to="/admin">
											Admin
										</Menu.Item>
									) : null}
									<Menu.Item icon={<Dashboard size={18} />} component={Link} to="/dashboard">
										Dashboard
									</Menu.Item>
									<Menu.Item icon={<Logout size={18} />} component={Link} to="/logout">
										Logout
									</Menu.Item>
								</Form>
							</Menu.Dropdown>
						</Menu>
					)}
				</Group>

				<Group spacing={5} className={classes.burger}>
					{/* <Burger opened={opened} onClick={toggle} className={classes.burger} size="sm" /> */}

					{props?.channel && (
						<Menu position="bottom-end">
							<Menu.Target>
								<UnstyledButton>
									<Avatar src={props.channel.profile_image_url} radius="xl" />
								</UnstyledButton>
							</Menu.Target>
							<Menu.Dropdown>
								<Form method="post">
									{props.channel.role == 1 ? (
										<Menu.Item icon={<Shield size={18} />} component={Link} to="/admin">
											Admin
										</Menu.Item>
									) : null}
									<Menu.Item icon={<Dashboard size={18} />} component={Link} to="/dashboard">
										Dashboard
									</Menu.Item>
									<Menu.Item icon={<Logout size={18} />} component={Link} to="/logout">
										Logout
									</Menu.Item>
								</Form>
							</Menu.Dropdown>
						</Menu>
					)}
				</Group>

				{/* <Transition transition="pop-top-right" duration={200} mounted={opened}>
					{(styles) => (
						<Paper className={classes.dropdown} withBorder style={styles}>
							
						</Paper>
					)}
				</Transition> */}
			</Container>
		</Header>
	);
}
