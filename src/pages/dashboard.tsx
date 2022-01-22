import { signin, signIn, signOut, useSession } from 'next-auth/client';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Header, { INavigation } from '../components/Header';

export default function Home() {
	const [session, loading] = useSession();
	const [emoteUpdates, setEmoteUpdates] = useState(false);
	// const router = useRouter();

	const navigation: INavigation[] = [
		{ name: 'Features', href: '/#features', current: false },
		{ name: 'Contact', href: '/#contact', current: false },
		{ name: 'Dashboard', href: '/dashboard', current: true },
	];

	useEffect(() => {
		if (session) {
			// GET /api/bot

			const data = async () => {
				const response = await fetch('/api/bot');
				const json = await response.json();
				console.log(json);
				let login = JSON.parse(session.user.email)['login'];
				if (json.message.includes(login)) {
					setEmoteUpdates(true);
				} else {
					setEmoteUpdates(false);
				}
			};

			data();
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

	function updateEmoteUpdates(state: boolean): boolean {
		console.log(state, 111);

		// POST /api/bot
		const data = async () => {
			const response = await fetch('/api/bot?login=' + JSON.parse(session.user.email)['login'], {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					emoteUpdates: state,
				}),
			});
			const json = await response.json();
			console.log(json);
		};

		data();

		return state;
	}

	return (
		<>
			<Header navigation={navigation} />
			<div>
				<h1 className="text-center">Welcome!</h1>

				{/* a checkbox that shows the emoteUpdates */}
				<div className="text-center">
					<label className="checkbox-label">
						<input
							type="checkbox"
							checked={emoteUpdates}
							onChange={() => {
								updateEmoteUpdates(emoteUpdates);
								setEmoteUpdates(!emoteUpdates);
							}}
						/>
						<span className="checkbox-custom rectangular"></span>
						<span className="checkbox-label-text">Emote Updates</span>
					</label>
				</div>
			</div>
		</>
	);
}
