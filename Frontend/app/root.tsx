import { Container, MantineProvider, Paper, ScrollArea, Text, Title } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import type { LoaderFunction, MetaFunction } from '@remix-run/node';

import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useCatch, useLoaderData } from '@remix-run/react';

import { NotificationsProvider } from '@mantine/notifications';
import { StylesPlaceholder } from '@mantine/remix';
import dbConnect from './services/mongo.server';

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: 'OuraBot',
	viewport: 'width=device-width,initial-scale=1',
	'og:type': 'website',
	'og:url': 'https://ourabot.com',
	'og:title': 'OuraBot — a powerful and FREE Twitch Bot',
	'og:description': 'OuraBot is a Twitch chat bot that you can use for free, empowering your Twitch channel.',
	'og:image': 'https://ourabot.com/resources/LogoBG.png',
	'twitter:card': 'summary_large_image',
	'twitter:creator': '@auror6s',
	'twitter:title': 'OuraBot — a powerful and FREE Twitch Bot',
	'twitter:description': 'OuraBot is a Twitch chat bot that you can use for free, empowering your Twitch channel.',
	'twitter:image': 'https://ourabot.com/resources/LogoBanner.png',
});

export const loader: LoaderFunction = async () => {
	await dbConnect();

	return true;
};

export function Mantine({ children }: { children: React.ReactNode }) {
	return (
		<MantineProvider
			theme={{
				colorScheme: 'dark',
				fontFamily: 'Montserrat, sans-serif',
				colors: {
					dark: ['#BFBFC2', '#A4A5A9', '#8E9196', '#595C63', '#34373D', '#292B30', '#212225', '#161719', '#101113', '#0C0D0F'],
				},
			}}
			withGlobalStyles
			withNormalizeCSS
		>
			<NotificationsProvider>
				<ModalsProvider>
					<html lang="en">
						<head>
							<link rel="icon" type="image/x-icon" href="/favicon.ico" />
							<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat" />
							<link rel="canonical" href="https://ourabot.com" />
							<Meta />
							<Links />
							<LiveReload />
							<StylesPlaceholder />
						</head>
						<body>
							{children}
							<Scripts />
						</body>
					</html>
				</ModalsProvider>
			</NotificationsProvider>
		</MantineProvider>
	);
}

export default function App() {
	const connected = useLoaderData();

	return (
		<Mantine>
			<Outlet />
			<ScrollRestoration />
		</Mantine>
	);
}

export function ErrorBoundary({ error }: { error: Error }) {
	const message = error.message;

	return (
		<Mantine>
			<Container size="lg">
				<Paper withBorder shadow="md" p="lg" mt="lg" radius="md">
					<Title>Error</Title>
					<Text>
						An unknown error has occured. Click{' '}
						<Text variant="link" component="a" href="/">
							here
						</Text>{' '}
						to return to the homepage.
					</Text>
					<ScrollArea>
						<pre>{error.message}</pre>
					</ScrollArea>
				</Paper>
			</Container>
		</Mantine>
	);
}

export function CatchBoundary() {
	const caught = useCatch();
	return (
		<Mantine>
			<Container size="lg">
				<Paper withBorder shadow="md" p="lg" mt="lg" radius="md">
					<Title>
						{caught.status} {StatusCodes[caught.status as keyof typeof StatusCodes]}
					</Title>
					<Text>{caught.status === 404 ? 'Page not found' : (caught.data as string)?.replace(/"/g, '')}</Text>
					<Text>
						Click{' '}
						<Text variant="link" component="a" href="/">
							here
						</Text>{' '}
						to return to the homepage.
					</Text>
				</Paper>
			</Container>
		</Mantine>
	);
}

const StatusCodes = {
	100: 'Continue',
	101: 'Switching Protocols',
	102: 'Processing',
	200: 'OK',
	201: 'Created',
	202: 'Accepted',
	203: 'Non Authoritative Information',
	204: 'No Content',
	205: 'Reset Content',
	206: 'Partial Content',
	207: 'Multi-Status',
	300: 'Multiple Choices',
	301: 'Moved Permanently',
	302: 'Moved Temporarily',
	303: 'See Other',
	304: 'Not Modified',
	305: 'Use Proxy',
	307: 'Temporary Redirect',
	308: 'Permanent Redirect',
	400: 'Bad Request',
	401: 'Unauthorized',
	402: 'Payment Required',
	403: 'Forbidden',
	404: 'Not Found',
	405: 'Method Not Allowed',
	406: 'Not Acceptable',
	407: 'Proxy Authentication Required',
	408: 'Request Timeout',
	409: 'Conflict',
	410: 'Gone',
	411: 'Length Required',
	412: 'Precondition Failed',
	413: 'Request Entity Too Large',
	414: 'Request-URI Too Long',
	415: 'Unsupported Media Type',
	416: 'Requested Range Not Satisfiable',
	417: 'Expectation Failed',
	418: "I'm a teapot",
	419: 'Insufficient Space on Resource',
	420: 'Method Failure',
	421: 'Misdirected Request',
	422: 'Unprocessable Entity',
	423: 'Locked',
	424: 'Failed Dependency',
	428: 'Precondition Required',
	429: 'Too Many Requests',
	431: 'Request Header Fields Too Large',
	451: 'Unavailable For Legal Reasons',
	500: 'Internal Server Error',
	501: 'Not Implemented',
	502: 'Bad Gateway',
	503: 'Service Unavailable',
	504: 'Gateway Timeout',
	505: 'HTTP Version Not Supported',
	507: 'Insufficient Storage',
	511: 'Network Authentication Required',
};
