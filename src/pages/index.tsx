import { signIn, signOut, useSession } from 'next-auth/client';
import Header, { INavigation } from '../components/Header';

export default function Home() {
	const navigation: INavigation[] = [
		{ name: 'Features', href: '#features', current: false },
		{ name: 'Contact', href: '#contact', current: false },
		{ name: 'Dashboard', href: '/dashboard', current: false },
	];

	return (
		<>
			<Header navigation={navigation} />
			<div>
				<h1 className="text-center">landing page here</h1>
			</div>
		</>
	);
}
