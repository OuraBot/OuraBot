import { ActionIcon, Badge, Tooltip } from '@mantine/core';
import { Star } from 'tabler-icons-react';

export default function PremiumBadge() {
	return (
		<a href="/dashboard/premium">
			<Tooltip label="Premium is required for this feature. Click for more info.">
				<Badge
					color="yellow"
					leftSection={
						<ActionIcon size="xs" color="blue" radius="xl" variant="transparent">
							<Star color="gold" />
						</ActionIcon>
					}
				>
					Premium
				</Badge>
			</Tooltip>
		</a>
	);
}
