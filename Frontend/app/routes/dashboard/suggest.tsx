import { Button, Divider, Group, Radio, Text, Textarea } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { Form, useActionData } from '@remix-run/react';
import { ActionArgs, LoaderArgs, MetaFunction, json } from '@remix-run/server-runtime';
import { useState } from 'react';
import { authenticator } from '~/services/auth.server';
import { ChannelModel } from '~/services/models/Channel';

export const meta: MetaFunction = () => {
	return {
		title: 'Suggest - OuraBot',
		description: 'Suggest features for OuraBot',
	};
};

export async function loader({ request }: LoaderArgs) {
	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});
	const channel = await ChannelModel.findOne({ id: session.json.id });

	return json({
		session,
		channel,
	});
}

export async function action({ request }: ActionArgs) {
	console.log('Hit');
	const formData = await request.formData();

	const session = await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const channel = await ChannelModel.findOne({ id: session.json.id });

	const type = (formData.get('type') ?? 'other') as string;
	const description = (formData.get('description') ?? 'No description provided') as string;

	// capitalize first letter of type
	const formattedType = type.charAt(0).toUpperCase() + type.slice(1);

	try {
		const payload = {
			username: 'OuraBot',
			avatar_url: 'https://ourabot.com/resources/LogoBG.png',
			embeds: [
				{
					description: `${description}`,
					author: {
						name: formattedType,
						icon_url: 'https://ourabot.com/resources/LogoBG.png',
					},
					footer: {
						icon_url: `${session.json.profile_image_url}`,
						text: `${channel.login} (${channel.id})`,
					},
					timestamp: new Date().toISOString(),
				},
			],
		};

		await fetch('https://discord.com/api/webhooks/1113160644359901255/vYRpc9WMdgWUVOtQy-mrcCrvexGx4ktVkEyKtwci8i-kJZ4rXVgXd2GK4l2EKZ6RAZ_b', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		return json({
			success: true,
		});
	} catch (e) {
		console.log(e);

		return json({
			success: false,
		});
	}
}
export default function Index() {
	const response = useActionData();
	const [showedNotification, setShowedNotification] = useState(false);

	if (response && response.success == true && !showedNotification) {
		setShowedNotification(true);
		showNotification({
			id: 'success',
			color: 'green',
			title: 'Success',
			message: 'Your suggestion has been sent!',
		});
	}

	if (response && response.success !== true && !showedNotification) {
		setShowedNotification(true);
		showNotification({
			id: 'error',
			color: 'red',
			title: 'Error',
			message: 'Your suggestion could not be sent. Please try again later.',
		});
	}

	return (
		<>
			<Text>
				Being community driven, we want to hear your suggestions! You can fill out the form below to suggest a feature for OuraBot and be attributed to it.
			</Text>

			<Text my="sm">If you are reporting a bug, please provide steps to reproduce the bug and any other information that may be useful.</Text>

			<Divider my="sm" />

			<Form method="post">
				<Radio.Group required name="type" label="Type of suggestion" defaultChecked={true} defaultValue="command" withAsterisk>
					<Group>
						<Radio value="command" label="Command" />
						<Radio value="bug" label="Bug" />
						<Radio value="feature" label="Feature" />
						<Radio value="other" label="Other" />
					</Group>
				</Radio.Group>
				<Textarea name="description" label="Description" placeholder="Describe your suggestion here." required />
				<Button variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} type="submit" my="sm">
					Submit
				</Button>
			</Form>
		</>
	);
}
