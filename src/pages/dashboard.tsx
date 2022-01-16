import { signIn, signOut, useSession } from 'next-auth/client';
import { useRouter } from 'next/router';
import Header, { INavigation } from '../components/Header';

export default function Home() {
	const [session, loading] = useSession();
	const router = useRouter();

	const navigation: INavigation[] = [
		{ name: 'Features', href: '/#features', current: false },
		{ name: 'Contact', href: '/#contact', current: false },
		{ name: 'Dashboard', href: '/dashboard', current: false },
	];

	if (loading) {
		return null;
	}

	if (!loading && !session) {
		signIn('twitch');
		return null;
	}

	if (session == null) {
		signIn('twitch');
	}

	console.log(session);

	return (
		<>
			<Header navigation={navigation} />
			<div>
				<h1 className="text-center">Welcome {session.user.name}</h1>
			</div>
		</>
	);
}
