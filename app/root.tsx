import { Button, ColorScheme, createEmotionCache, Title } from '@mantine/core';
import { MantineProvider, ColorSchemeProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { ModalsProvider } from '@mantine/modals';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LinksFunction, LoaderFunction, MetaFunction } from '@remix-run/node';

import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';

import dbConnect from './services/mongo.server';
import { NotificationsProvider } from '@mantine/notifications';
import { StylesPlaceholder } from '@mantine/remix';

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: 'OuraBot',
	viewport: 'width=device-width,initial-scale=1',
});

export const loader: LoaderFunction = async () => {
	await dbConnect();

	return true;
};

export default function App() {
	const connected = useLoaderData();

	return (
		<MantineProvider
			theme={{
				colorScheme: 'dark',
			}}
			withGlobalStyles
			withNormalizeCSS
		>
			<NotificationsProvider>
				<ModalsProvider>
					<html lang="en">
						<head>
							<Meta />
							<Links />
							<StylesPlaceholder />
						</head>
						<body>
							<Outlet />
							<ScrollRestoration />
							<Scripts />
							<LiveReload />
						</body>
					</html>
				</ModalsProvider>
			</NotificationsProvider>
		</MantineProvider>
	);
}

export function ErrorBoundary({ error }: { error: Error }) {
	return (
		<MantineProvider
			theme={{
				colorScheme: 'dark',
			}}
			withGlobalStyles
			withNormalizeCSS
		>
			<NotificationsProvider>
				<ModalsProvider>
					<html lang="en">
						<head>
							<Meta />
							<Links />
							<StylesPlaceholder />
						</head>
						<body>
							<Title>App Error</Title>
							<pre>{error.message}</pre>
							<pre>{error.stack}</pre>
							<Link to="/">
								<Button>Go Home</Button>
							</Link>
						</body>
					</html>
				</ModalsProvider>
			</NotificationsProvider>
		</MantineProvider>
	);
}
