import { RemixBrowser } from '@remix-run/react';
import { hydrate } from 'react-dom';
import { ClientProvider } from '@mantine/remix';
import { useLocation, useMatches } from '@remix-run/react';
import * as Sentry from '@sentry/remix';
import { useEffect } from 'react';
import { createEmotionCache } from '@mantine/core';

Sentry.init({
	denyUrls: ['https://ourabot.com/api/grafana/admin'],
	beforeSendTransaction(event) {
		if (event.transaction?.includes('/api/grafana')) {
			return null;
		}
		return event;
	},
	ignoreTransactions: ['/api/grafana/admin'],
	dsn:
		process.env.NODE_ENV === 'production'
			? 'https://5c0abffe843d4fab8a7915be315b3058:5af23cd2c9b044b1852cdec606f4c999@o4505139595575296.ingest.sentry.io/4505211544076288'
			: '',
	integrations: [
		new Sentry.BrowserTracing({
			routingInstrumentation: Sentry.remixRouterInstrumentation(useEffect, useLocation, useMatches),
		}),
		new Sentry.Replay(),
	],
	// Performance Monitoring
	tracesSampleRate: 0.2, // Capture 100% of the transactions, reduce in production!
	// Session Replay
	replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
	replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

let emotionCache = createEmotionCache({ key: 'mantine' });

hydrate(
	<ClientProvider emotionCache={emotionCache}>
		<RemixBrowser />
	</ClientProvider>,
	document
);
