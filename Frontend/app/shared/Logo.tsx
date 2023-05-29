import React from 'react';
import { Image, useMantineTheme } from '@mantine/core';

interface OuraBotLogoProps extends React.ComponentPropsWithoutRef<'svg'> {
	variant?: 'white' | 'default';
	width?: number;
}

export function OuraBotLogo({ variant = 'default', width = 110, ...others }: OuraBotLogoProps) {
	const theme = useMantineTheme();
	return (
		<a href="/">
			<Image src="/resources/LogoText.png" fit="contain" width="45%" alt="OuraBot" />
		</a>
	);
}
