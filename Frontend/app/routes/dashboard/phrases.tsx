import { Button, Group, Input, Radio, SegmentedControl, Table, Text, TextInput, Title, useMantineTheme } from '@mantine/core';
import { ModalsProvider, useModals } from '@mantine/modals';
import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Edit, Plus, Search } from 'tabler-icons-react';
import NewPhrase from '~/components/NewPhrase';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import { query } from '~/services/redis.server';

type Phrase = {
	name: string;
	response: {
		type: 'timeout' | 'ban' | 'message';
		value: string;
	};
	cooldowns: {
		user: number;
		channel: number;
	};
	permissions: string[];
};

export async function loader({ request }: LoaderArgs) {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await ChannelModel.findOne({ id: session.json.id });

	const phrases = await query('QUERY', 'Phrases', channel.token, session.json.id);

	if (phrases.status !== 200) throw new Error(`QUERY Phrases returned error code ${phrases.status}`);

	return json({
		session,
		channel,
		phrases,
	});
}

export const meta: MetaFunction = () => {
	return {
		title: 'Phrases / OuraBot',
		description: 'Manage your phrases',
	};
};

export async function action({ request }: ActionArgs) {
	console.log('Hit');

	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const channel = await ChannelModel.findOne({ id: session.json.id });

	const formData = await request.formData();

	console.log(formData.forEach((value, key) => console.log(`${key}: ${value}`)));

	const responseType = formData.get('responsetype') as 'message' | 'timeout' | 'ban';

	const name = formData.get('name') as string;

	if (responseType === 'message') {
		const response = formData.get('message-response') as string;
		const reply = formData.get('message-reply') === 'on' ? true : false;
		const trigger = formData.get('message-phrase') as string;
		const regex = formData.get('message-regex') === 'on' ? true : false;

		const updated = await query('UPDATE', 'Phrases', channel.token, session.json.id, {
			name,
			response: {
				type: responseType,
				value: response,
				reply,
			},
			trigger: {
				value: trigger,
				regex,
			},
			cooldowns: {
				user: 0,
				channel: 0,
			},
		});

		return updated;
	} else {
		return null;
	}
}

export default function Phrases() {
	const data = useLoaderData<typeof loader>();
	const [search, setSearch] = useState('');
	const theme = useMantineTheme();
	const modals = useModals();
	let phrases = data.phrases?.data;
	const [searchResults, setSearchResults] = useState(phrases ?? []);
	const [responseType, setResponseType] = useState('message');

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(event.target.value);
		setSearchResults(
			phrases?.filter(
				(phrase: Phrase) =>
					phrase.name.toLowerCase().includes(event.target.value.toLowerCase()) || phrase.response.value.toLowerCase().includes(event.target.value.toLowerCase())
			)
		);
	};

	const openCreateModal = () => {
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
					<Title order={3}>Create Phrase</Title>
				</>
			),
			children: (
				<>
					<NewPhrase />
				</>
			),
		});
	};

	return (
		<>
			<ModalsProvider>
				<Group mt="xs">
					<TextInput icon={<Search size={14} />} style={{ flex: 1 }} placeholder="Search by name or description" />
					<Button
						leftIcon={<Plus size={20} />}
						onClick={() => {
							openCreateModal();
						}}
					>
						Create
					</Button>
				</Group>
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
							<th>Response</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{searchResults.length > 0 ? (
							searchResults.map((phrase: any) => (
								<tr key={phrase.name}>
									<td>{phrase.name}</td>
									<td>{phrase.reponse.value}</td>
									<td>
										<Button
											variant="outline"
											leftIcon={<Edit size={20} />}
											onClick={() => {
												// openDefaultModal(phrase);
											}}
										>
											Edit
										</Button>
									</td>
								</tr>
							))
						) : (
							// <td colSpan={Object.keys(phrases[0]).length}>
							// 	<Center>
							// 		<Text weight="bold" align="center" my="sm">
							// 			No results found
							// 		</Text>
							// 	</Center>
							// </td>
							<></>
						)}
					</tbody>
				</Table>
			</ModalsProvider>
		</>
	);
}
