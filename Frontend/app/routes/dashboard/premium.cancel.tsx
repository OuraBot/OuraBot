import { Button, Text } from '@mantine/core';

export default function PremiumCancel() {
	return (
		<>
			<Text>Your purchase has been canceled. You have not been charged.</Text>
			<Button component="a" href="/dashboard/premium" color="blue">
				Okay
			</Button>
		</>
	);
}
