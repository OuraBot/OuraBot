import { signin, signIn, signOut, useSession } from 'next-auth/client';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Header, { INavigation } from '../components/Header';

export default function Home() {
	const [session, loading] = useSession();
	const [inChannel, setInChannel] = useState(false);
	// const router = useRouter();

	const navigation: INavigation[] = [
		{ name: 'Features', href: '/#features', current: false },
		{ name: 'Contact', href: '/#contact', current: false },
		{ name: 'Dashboard', href: '/dashboard', current: true },
	];

	// '/api/inChannel?channelid=' + session.id
	useEffect(() => {
		if (session) {
			//
		}
	}, [session]);

	if (loading) {
		return null;
	}

	if (!loading && !session) {
		signIn('twitch');
		return null;
	}

	if (session == null) {
		signIn('twitch');
		return null;
	}

	return (
		<>
			<Header navigation={navigation} />
			<div>
				<h1 className="text-center">Welcome! Is the bot in your channel?</h1>
				<h2 className="text-center">{inChannel ? 'Yes' : 'No'}</h2>
			</div>
		</>
	);
}
