import { Button, ColorScheme } from '@mantine/core';
import { MantineProvider, ColorSchemeProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { ModalsProvider } from '@mantine/modals';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LinksFunction, LoaderFunction, MetaFunction } from '@remix-run/node';

import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useCatch, useLoaderData } from '@remix-run/react';

import dbConnect from './services/mongo.server';
import styles from './tailwind.css';
import { NotificationsProvider } from '@mantine/notifications';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: styles }];
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
		<html lang="en">
			<head>
				<Meta />
				<Links />
			</head>
			<body>
				<MantineTheme>{connected ? <Outlet /> : null}</MantineTheme>
				<ScrollRestoration />
				<Scripts />
				{process.env.NODE_ENV === 'development' && <LiveReload />}
			</body>
		</html>
	);
}

function MantineTheme({ children }: { children: React.ReactNode }) {
	const [colorScheme, setColorScheme] = useState<ColorScheme>('dark');
	const toggleColorScheme = (value?: ColorScheme) => setColorScheme('dark');

	// theme={{ colorScheme }}
	return (
		<ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
			<MantineProvider
				theme={{ colorScheme }}
				withGlobalStyles
				withNormalizeCSS
				emotionOptions={{ key: 'mantine', prepend: false }}
			>
				<NotificationsProvider>
					<ModalsProvider>{children}</ModalsProvider>
				</NotificationsProvider>
			</MantineProvider>
		</ColorSchemeProvider>
	);
}

export function ErrorBoundary({ error }: { error: Error }) {
	return (
		<html lang="en">
			<head>
				<Meta />
				<Links />
			</head>
			<body>
				<MantineTheme>
					<h1>App Error</h1>
					<pre>{error.message}</pre>
					<pre>{error.stack}</pre>
					<Link to="/">
						<Button>Go Home</Button>
					</Link>
				</MantineTheme>
				<ScrollRestoration />
				<Scripts />
				{process.env.NODE_ENV === 'development' && <LiveReload />}
			</body>
		</html>
	);
}
