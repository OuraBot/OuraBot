import { Button, Container, Paper } from '@mantine/core';
import React from 'react';
import { Form } from "@remix-run/react";

export function LoginMenu() {
	return (
		<Container size={400} my={100}>
			<Paper withBorder shadow="md" p={30} mt={30} radius="md">
				<Form method="post">
					<Button
						type="submit"
						sx={{ backgroundColor: '#6441a5', color: 'white', ':hover': { backgroundColor: '#593A93' } }}
						fullWidth
					>
						Sign in with Twitch
					</Button>
				</Form>
			</Paper>
		</Container>
	);
}
