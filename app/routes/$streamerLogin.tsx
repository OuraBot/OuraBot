import { Avatar, Button, Center, Container, Group, Table, Text } from '@mantine/core';
import { fetch } from '@remix-run/node';
import { LoaderFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { _model as Channel } from '~/services/models/Channel';
import dbConnect from '~/services/mongo.server';

export type IvrFiUser = {
	status: number;
	banned: boolean;
	displayName: string;
	login: string;
	id: string;
	bio: string;
	chatColor: string;
	logo: string;
	partner: boolean;
	affiliate: boolean;
	bot: boolean;
	createdAt: string;
	updatedAt: string;
	chatSettings: {
		chatDelayMs: number | null;
		followersOnlyDurationMinutes: number | null;
		slowModeDurationSeconds: number | null;
		blockLinks: boolean | null;
		isSubscribersOnlyModeEnabled: boolean | null;
		isEmoteOnlyModeEnabled: boolean | null;
		isFastSubsModeEnabled: boolean | null;
		isUniqueChatModeEnabled: boolean | null;
		requireVerifiedAccount: boolean | null;
		rules: string[] | null;
	};
	badge: string[];
	roles: {
		isAffiliate: boolean;
		isPartner: boolean;
		isSiteAdmin: boolean | null;
		isStaff: boolean | null;
	};
	settings: {
		preferredLanguageTag: string;
	};
	panels: {
		id: string;
	}[];
};

type UserType = {
	user: {
		login: string;
		id: string;
		role: number;
		token: string;
		managers: string[];
		banned: string | null;
		readTos: boolean;
	} | null;

	ivrUserData: IvrFiUser;
};

export const loader: LoaderFunction = async ({ params }) => {
	// The `user` variable is used for getting the user's data from the Oura Bot database
	// - to get commands and such.

	// The `ivrUserData` variable is only for getting the user's profile picture
	// - or fallback data for if the user doesn't exist in the OB database.
	let [user, ivrUserData] = await Promise.all([
		Channel.findOne({ login: params.streamerLogin }),
		(await fetch(`https://api.ivr.fi/twitch/resolve/${params.streamerLogin}`)).json(),
	]);

	if (!user) {
		return { user: null, ivrUserData };
	}

	return {
		user,
		ivrUserData,
	} as unknown as UserType;
};

export default function StreamerPage() {
	const { user, ivrUserData } = useLoaderData() as UserType;

	return (
		<Container mb="xl">
			{user ? (
				<>
					<Group mt="xl" position="center" mb="sm">
						<Avatar src={ivrUserData.logo} alt={user.login + "'s profile image."} size="lg" radius="xl" />
						<h1>{user.login}'s Commands</h1>
					</Group>
					<Text mb="xl" align="center">
						Below are commands available in {user.login}'s chat.
					</Text>

					<Table>
						<thead>
							<tr>
								<th>Command</th>
								<th>Description</th>
								<th>Usage</th>
								<th>Enabled</th>
							</tr>
						</thead>
						<tbody>
							{/* replace this stuff with commands whenever we get that in the database */}
							{ivrUserData.panels.map((panel) => (
								//   PLACEHOLDER
								<tr key={panel.id}>
									{/* PLACEHOLDER */}
									<td>{panel.id}</td>
									<td>{panel.id}</td>
									<td>{panel.id}</td>
									<td>{panel.id}</td>
									{/* PLACEHOLDER */}
								</tr>
								// PLACEHOLDER
							))}
						</tbody>
					</Table>
				</>
			) : (
				<div
					style={{
						//   center div to middle of page
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
					}}
				>
					<Group>
						<Avatar
							src={ivrUserData.logo}
							alt={ivrUserData.login + "'s profile image."}
							size="lg"
							radius="xl"
						/>
						<h1>{ivrUserData.login}'s data could not be found</h1>
					</Group>

					<Center>
						<Button component={Link} to="/" prefetch="intent">
							Go Home
						</Button>
					</Center>
				</div>
			)}
		</Container>
	);
}
