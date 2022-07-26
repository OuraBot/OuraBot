import {
	Box,
	Button,
	Center,
	Divider,
	InputWrapper,
	MultiSelect,
	NumberInput,
	SegmentedControl,
	Switch,
	Table,
	Tabs,
	Text,
	TextInput,
	Title,
	useMantineTheme,
} from '@mantine/core';
import { ModalsProvider, useModals } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useSubmit } from '@remix-run/react';
import { useState } from 'react';
import { Edit, Search } from 'tabler-icons-react';
import { authenticator } from '~/services/auth.server';
import { _model as Channel } from '~/services/models/Channel';
import { query } from '~/services/redis.server';

export enum Permission {
	Owner,
	Admin,
	Broadcaster,
	Moderator,
	VIP,
	Subscriber,
}

let PERMISSIONS: string[] = Object.keys(Permission).map((p) => p.toString());
PERMISSIONS = PERMISSIONS.slice(PERMISSIONS.length / 2);

const MAX_COOLDOWN_TIME = 3600; // 1 hour

export async function loader({ request }: LoaderArgs) {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await Channel.findOne({ id: session.json.id });

	const commands = await query('QUERY', 'Commands', channel.token, session.json.id);

	return json({
		session,
		channel,
		commands,
	});
}

export async function action({ request }: ActionArgs) {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const channel = await Channel.findOne({ id: session.json.id });

	const formData = await request.formData();

	let name = formData.get('name');
	let enabled = formData.get('enabled') === 'on' ? true : false;
	let chatMode = formData.get('chatmode') as 'online' | 'both' | 'offline';
	let minimumUserCooldown: any = formData.get('minimumusercooldown');
	let minimumChannelCooldown: any = formData.get('minimumchannelcooldown');
	let permissions: any = formData.get('permissions');
	let userCooldown: any = formData.get('usercooldown');
	let channelCooldown: any = formData.get('channelcooldown');

	// For some reason the switch values are undefined/null when they are not checked
	// so we do not check if they are present below
	if (!name || !minimumUserCooldown || !minimumChannelCooldown) {
		return json({
			status: 400,
			title: 'Error',
			body: 'Missing fields',
			color: 'danger',
		});
	}

	minimumUserCooldown = parseInt(minimumUserCooldown as string) || 0;
	minimumChannelCooldown = parseInt(minimumChannelCooldown as string) || 0;
	userCooldown = parseInt(userCooldown as string) || minimumUserCooldown;
	channelCooldown = parseInt(channelCooldown as string) || minimumChannelCooldown;
	permissions = permissions?.split(',') ?? [];

	if (!inBounds(minimumUserCooldown as number, MAX_COOLDOWN_TIME, userCooldown)) {
		return json({
			status: 400,
			title: 'Error',
			body: 'User cooldown is out of bounds',
			color: 'danger',
		});
	}

	if (!inBounds(minimumChannelCooldown as number, MAX_COOLDOWN_TIME, channelCooldown)) {
		return json({
			status: 400,
			title: 'Error',
			body: 'Channel cooldown is out of bounds',
			color: 'danger',
		});
	}

	const response = await query('UPDATE', 'Commands', channel.token, session.json.id, {
		modifiedDefaultCommands: [
			{
				name,
				enabled,
				chatMode,
				modifiedPermissions: permissions,
				modifiedUserCooldown: userCooldown,
				modifiedChannelCooldown: channelCooldown,
			},
		],
	});

	return response;
}

type Command = {
	name: string;
	description: string;
	usage: string;
	userCooldown: number;
	channelCooldown: number;
	minimumUserCooldown: number;
	minimumChannelCooldown: number;
	modifiablePermissions: boolean;
	permissions: Permission[];
	enabled: boolean;
	chatMode: 'online' | 'both' | 'offline';
};

export default function Commands() {
	const data = useLoaderData<typeof loader>();
	const submit = useSubmit();
	const [showedNotification, setShowedNotification] = useState(false);
	const response = useActionData();

	if (response && response.status !== 200 && !showedNotification) {
		setShowedNotification(true);
		showNotification({
			id: 'error',
			color: 'red',
			title: 'Error',
			message: `Error while saving: ${response?.data?.message || 'Unknown error'}`,
		});
	}

	if (response && response.status == 200 && !showedNotification) {
		setShowedNotification(true);
		showNotification({
			id: 'success',
			color: 'green',
			title: 'Success',
			message: `${
				response.data?.message?.charAt(0).toUpperCase() + response.data?.message?.slice(1) ||
				'Your modifications have been saved'
			}`,
		});
	}

	const moderationCommands: Command[] = data.commands.data?.defaultCommands['Moderation'] || [];
	const utilityCommands: Command[] = data.commands.data?.defaultCommands['Utility'] || [];
	const funCommands: Command[] = data.commands.data?.defaultCommands['Fun'] || [];
	// const customCommands: any[] = data.commands.data.customCommands || [];

	return (
		<ModalsProvider>
			<Tabs grow>
				<Tabs.Tab label="Moderation">
					<SearchTable commands={moderationCommands} />
				</Tabs.Tab>
				<Tabs.Tab label="Utility">
					<SearchTable commands={utilityCommands} />
				</Tabs.Tab>
				<Tabs.Tab label="Fun">
					<SearchTable commands={funCommands} />
				</Tabs.Tab>
				{/* <Tabs.Tab label="Custom">
				<SearchTable commands={customCommands} />
			</Tabs.Tab> */}
			</Tabs>
		</ModalsProvider>
	);
}

function SearchTable({ commands }: { commands: Command[] }) {
	const [search, setSearch] = useState('');
	const [searchResults, setSearchResults] = useState(commands);
	const modals = useModals();
	const theme = useMantineTheme();

	const openDefaultModal = (command: Command) => {
		const id = modals.openModal({
			size: 'lg',
			overlayBlur: 0.75,
			overlayColor: theme.colorScheme === 'dark' ? theme.colors.dark[9] : theme.colors.gray[2],
			overlayOpacity: 0.55,
			transition: 'fade',
			transitionDuration: 300,
			transitionTimingFunction: 'ease',
			title: (
				<>
					<Title order={3}>
						Edit Command: <code>{command.name}</code>
					</Title>
				</>
			),
			children: (
				<>
					<Form method="post">
						<Text size="sm">{command.description}</Text>
						{/* <Prism withLineNumbers language="json">
							{JSON.stringify(command, null, 2)}
						</Prism> */}
						<Divider my="md" label="" labelPosition="left" />
						<input type="hidden" id="name" name="name" value={command.name} />
						<input
							type="hidden"
							id="minimumusercooldown"
							name="minimumusercooldown"
							value={command.minimumUserCooldown}
						/>{' '}
						<input
							type="hidden"
							id="minimumchannelcooldown"
							name="minimumchannelcooldown"
							value={command.minimumChannelCooldown}
						/>
						<Switch
							name="enabled"
							id="enabled"
							my="md"
							defaultChecked={command.enabled}
							label="Command Enabled"
						/>
						<NumberInput
							placeholder={`${command.minimumUserCooldown}`}
							description={`Must be between ${command.minimumUserCooldown}s and ${MAX_COOLDOWN_TIME}s`}
							min={command.minimumUserCooldown}
							max={MAX_COOLDOWN_TIME}
							name="usercooldown"
							id="usercooldown"
							my="md"
							defaultValue={command.userCooldown}
							label="User Cooldown (seconds)"
						/>
						<NumberInput
							placeholder={`${command.minimumChannelCooldown}`}
							description={`Must be between ${command.minimumChannelCooldown}s and ${MAX_COOLDOWN_TIME}s`}
							min={command.minimumChannelCooldown}
							max={MAX_COOLDOWN_TIME}
							name="channelcooldown"
							id="channelcooldown"
							my="md"
							defaultValue={command.channelCooldown}
							label="Channel Cooldown (seconds)"
						/>
						<InputWrapper mb="sm" label="Chat Modes" description="When should the command be available?">
							<SegmentedControl
								name="chatmode"
								id="chatmode"
								defaultValue={command.chatMode}
								color="blue"
								data={[
									{ label: 'Live', value: 'online' },
									{ label: 'Both', value: 'both' },
									{ label: 'Offline', value: 'offline' },
								]}
							/>
						</InputWrapper>
						<MultiSelect
							label="Permissions"
							description="Manage who can use this command"
							id="permissions"
							name="permissions"
							placeholder="Everyone can use this command"
							transitionDuration={150}
							transition="scale-y"
							transitionTimingFunction=""
							disabled={!command.modifiablePermissions}
							data={PERMISSIONS}
							defaultValue={command.permissions.map((p) => p.toString())}
						/>
						<Button type="submit" fullWidth mt="md">
							Save
						</Button>
					</Form>
				</>
			),
		});
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(event.target.value);
		setSearchResults(
			commands.filter(
				(command) =>
					command.name.toLowerCase().includes(event.target.value.toLowerCase()) ||
					command.description.toLowerCase().includes(event.target.value.toLowerCase())
			)
		);
	};

	return (
		<>
			<Box>
				<TextInput
					icon={<Search size={14} />}
					placeholder="Search by name or description"
					onChange={handleSearchChange}
					value={search}
				/>
				<Table
					my="md"
					horizontalSpacing="md"
					verticalSpacing="xs"
					sx={{
						'td:last-of-type': {
							width: '1em',
						},
					}}
				>
					<thead>
						<tr>
							<th>Name</th>
							<th>Description</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{searchResults.length > 0 ? (
							searchResults.map((command) => (
								<tr key={command.name}>
									<td>{command.name}</td>
									<td>{command.description}</td>
									<td>
										<Button
											variant="outline"
											leftIcon={<Edit size={20} />}
											onClick={() => {
												openDefaultModal(command);
											}}
										>
											Edit
										</Button>
									</td>
								</tr>
							))
						) : (
							<td colSpan={Object.keys(commands[0]).length}>
								<Center>
									<Text weight="bold" align="center" my="sm">
										No results found
									</Text>
								</Center>
							</td>
						)}
					</tbody>
				</Table>
			</Box>
		</>
	);
}

function inBounds(min: number, max: number, value: number) {
	return value >= min && value <= max;
}
