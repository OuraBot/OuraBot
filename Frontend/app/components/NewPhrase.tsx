import { Button, Input, SegmentedControl, TextInput, Text, Collapse, Table, Code, Textarea, Checkbox, Box, Divider } from '@mantine/core';
import { Form } from '@remix-run/react';
import { useState } from 'react';

const variables = [
	{
		name: 'user',
		description: 'Username of the user who triggered the phrase',
	},
];

export default function NewPhrase() {
	const [responseType, setResponseType] = useState('message');

	return (
		<>
			<Form method="post" action="/dashboard/phrases">
				<TextInput required name="name" label="Name" placeholder="Phrase name" />
				<Divider mt="sm" />
				<Input.Wrapper required my="sm" label="Phrase" description="What message should make the bot trigger this phrase??">
					<TextInput required my="sm" name="message-phrase" placeholder="Phrase to trigger" />
					<Checkbox id="message-regex" name="message-regex" label="Use regex?" my="sm" />
				</Input.Wrapper>
				<Input.Wrapper my="sm" label="Response Type" description="How should the bot respond to the phrase?">
					<SegmentedControl
						name="responsetype"
						id="responsetype"
						mt="xs"
						value={responseType}
						onChange={setResponseType}
						color="blue"
						data={[
							{ label: 'Message', value: 'message' },
							{ label: 'Timeout', value: 'timeout' },
							{ label: 'Ban', value: 'ban' },
						]}
					/>
					{responseType === 'message' ? (
						<>
							<Textarea required maxLength={450} id="message-response" name="message-response" label="Response" placeholder="Phrase response" mb="sm" />
							<Checkbox id="message-reply" name="message-reply" label="Reply to message" my="sm" />
						</>
					) : responseType === 'timeout' ? (
						<div>timeout</div>
					) : responseType === 'ban' ? (
						<div>ban</div>
					) : (
						<Text>Select a response type</Text>
					)}
				</Input.Wrapper>
				<Table>
					<thead>
						<tr>
							<th>Variable</th>
							<th>Value</th>
						</tr>
					</thead>
					<tbody>
						{variables.map((variable) => (
							// eslint-disable-next-line react/jsx-key
							<tr>
								<td>
									<Code>&#123;{variable.name}&#125;</Code>
								</td>
								<td>{variable.description}</td>
							</tr>
						))}
					</tbody>
				</Table>
				<Button type="submit" fullWidth mt="md">
					Save
				</Button>
			</Form>
		</>
	);
}
