import NextAuth from 'next-auth';

export default NextAuth({
	providers: [
		{
			id: 'twitch',
			name: 'Twitch',
			type: 'oauth',
			version: '2.0',
			params: {
				grant_type: 'authorization_code',
			},
			scope: 'user:read:email',
			accessTokenUrl: 'https://id.twitch.tv/oauth2/token',
			authorizationUrl: 'https://id.twitch.tv/oauth2/authorize?response_type=code',
			profileUrl: 'https://api.twitch.tv/helix/users',
			clientId: process.env.TWITCH_CLIENT_ID,
			clientSecret: process.env.TWITCH_CLIENT_SECRET,
			profile: (profile) => {
				return {
					id: profile.data[0].id,
					name: profile.data[0].login,
					// this is horrendous, but it's the only way to get all the data because of this dumb library
					email: JSON.stringify(profile.data[0]),
					picture: profile.data[0].profile_image_url,
				};
			},
		},
	],
	// mongodb
	database: process.env.MONGO_URI,
});
