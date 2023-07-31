import { renderToString } from 'react-dom/server';
import { RemixServer } from '@remix-run/react';
import type { EntryContext } from '@remix-run/node';
import { injectStyles, createStylesServer } from '@mantine/remix';
import { useLocation, useMatches } from '@remix-run/react';
import * as Sentry from '@sentry/remix';
import { useEffect } from 'react';

Sentry.init({
	dsn:
		process.env.NODE_ENV === 'production'
			? 'https://5c0abffe843d4fab8a7915be315b3058:5af23cd2c9b044b1852cdec606f4c999@o4505139595575296.ingest.sentry.io/4505211544076288'
			: '',
	integrations: [],
	// Performance Monitoring
	tracesSampleRate: 0.2, // Capture 100% of the transactions, reduce in production!
});

const server = createStylesServer();

export default function handleRequest(request: Request, responseStatusCode: number, responseHeaders: Headers, remixContext: EntryContext) {
	let markup = renderToString(<RemixServer context={remixContext} url={request.url} />);
	responseHeaders.set('Content-Type', 'text/html');

	return new Response(`<!DOCTYPE html>${injectStyles(markup, server)}`, {
		status: responseStatusCode,
		headers: responseHeaders,
	});
}
