import { Switch } from '@mantine/core';
import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Activity } from 'tabler-icons-react';
import { FeaturesGrid } from '~/components/features';
import { FooterSimple } from '~/components/Footer';
import { HeaderResponsive } from '~/components/Header';
import { HeroBullets } from '~/components/Hero';
import { authenticator } from '~/services/auth.server';

export let loader: LoaderFunction = async ({ request }) => {
	return await authenticator.isAuthenticated(request, {});
};

export const action: ActionFunction = async ({ request }) => {
	await authenticator.logout(request, { redirectTo: '/' });
};

export default function Index() {
	let data = useLoaderData();

	return (
		<>
			<HeaderResponsive links={[{ label: 'Features', link: '#features' }]} session={data} />
			<HeroBullets session={data} />
			<FeaturesGrid
				title="Title"
				description="Description"
				data={[
					{ title: 'Feature', description: 'Description', icon: Activity },
					{ title: 'Feature', description: 'Description', icon: Activity },
				]}
			/>
			<Form method="post">
				<button>Logout</button>
			</Form>
			<p>{JSON.stringify(data)}</p>
			<Switch>Switch</Switch>
			<FooterSimple links={[{ label: 'Twitter', link: 'https://twitter.com/auror6s' }]} />
		</>
	);
}
