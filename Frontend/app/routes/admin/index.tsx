import { Prism } from '@mantine/prism';
import type { LoaderFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { forbidden, unauthorized } from 'remix-utils';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';
import type { IChannel } from '~/services/models/Channel';
import type { TwitchSession } from '~/services/oauth.strategy';
import { query } from '~/services/redis.server';

import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

export const loader: LoaderFunction = async ({ params, request }) => {
	const session: TwitchSession = (
		await authenticator.isAuthenticated(request, {
			failureRedirect: '/login',
		})
	).json;

	const channel: IChannel | null = await ChannelModel.findOne({ id: session.id });

	if (!channel) throw unauthorized('Channel not found');

	if (channel.role !== 1) throw forbidden('Missing permissions');

	const admin = await query('QUERY', 'Admin', channel.token, session.id);

	return {
		session,
		channel,
		admin,
	};
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const options = {
	responsive: true,
	plugins: {
		legend: {
			position: 'top' as const,
		},
		title: {
			display: true,
			text: 'Messages per minute',
		},
	},
};

export default function Index() {
	const data = useLoaderData<typeof loader>();

	console.log(data.admin.data.ob.metrics.messages.history);

	const datasets = [];
	const labels: string[] = [];

	type Metric = {
		// the epoch timestamp
		timestamp: number;
		// the amount of messages per second
		rate: number;
		// if the rate is the same as the previous one, through to this timestamp
		to?: number;
	};

	for (const [key, value] of Object.entries(data.admin.data.ob.metrics.messages.history)) {
		let metrics = value as Metric[];

		while (metrics.some((metric) => metric.to)) {
			console.log('AAAAAAAAAAAAAA');
			const metric = metrics.find((metric) => metric.to);

			const skips = Math.floor((metric!.to! - metric!.timestamp) / 6e4);
			console.log(skips);
			for (let i = 1; i < skips; i++) {
				metrics.splice(metrics.indexOf(metric!) + i, 0, {
					timestamp: metric!.timestamp + i * 6e4,
					rate: metric!.rate,
				});
			}

			metric!.to = undefined;
		}

		const data = metrics.map((metric: Metric) => {
			return {
				x: `${new Date(metric.timestamp).toTimeString().split(' ')[0]}`,
				y: metric.rate,
			};
		});

		datasets.push({
			label: key,
			data: data,
			borderColor: stringToColor(key),
			backgroundColor: stringToColor(key),
		});
	}

	return (
		<>
			<p>Messages</p>
			<Line
				options={options}
				data={{
					labels,
					datasets,
				}}
			/>
			<Prism withLineNumbers language="json">
				{JSON.stringify(data.admin.data, null, 2)}
			</Prism>
		</>
	);
}

// https://stackoverflow.com/a/16348977
let stringToColor = function (str: string) {
	var hash = 0;
	for (var i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	var color = '#';
	for (var j = 0; j < 3; j++) {
		var value = (hash >> (j * 8)) & 0xff;
		color += ('00' + value.toString(16)).substr(-2);
	}
	return color;
};
