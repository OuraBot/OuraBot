import { connection, model, Schema, models } from 'mongoose';
const ModelName = 'Channel';

export interface DefaultCommandOption {
	// Name of the command
	name: string;
	// The modified user cooldown
	modifiedUserCooldown: number;
	// The modified channel cooldown
	modifiedChannelCooldown: number;
	// The modified permission integer
	modifiedPermissions: string[];
	// Enabled or disabled
	enabled: boolean;
	// Offline chat only
	chatMode: 'offline' | 'both' | 'online';
}

export interface IChannel extends Schema {
	// Twitch Login
	login: string;
	// Twitch Id
	id: string;
	// Role (admin, ambassador, user)
	role: number;
	// Token for API
	token: string;
	// List of managers by IDs
	managers: string[];
	// Null if not banned; string with reason
	banned?: string;
	// Prefix set by user
	prefix: string;
	// Twitch profile pfp
	profile_image_url: string;
	// SevenTV emote events
	emoteEvents: boolean;
	// Clip Discord webhook
	clipUrl: string;
	// Moderation modules
	// TODO: allow for module customization (different timeout lengths, etc.)
	modules: string[];
	// Default command options
	defaultCommandOptions: DefaultCommandOption[];
	// Lastfm username
	lastfmUsername: string;
	// Premium information
	premium: {
		orders: {
			id: string;
			createdAt: Date;
			expiresAt: Date;
			duration: number;
			email: string;
			status: 'PENDING' | 'PAID';
		}[];
	};
}

export const ChannelSchema = new Schema<IChannel>(
	{
		login: { type: String, required: true },
		id: { type: String, required: true },
		role: { type: Number, required: true, default: 0 },
		token: { type: String, required: true },
		managers: { type: [String], required: true, default: [] },
		banned: { type: String, required: false },
		prefix: { type: String, required: true, default: '!' },
		profile_image_url: { type: String, required: true },
		emoteEvents: { type: Boolean, required: true, default: false },
		clipUrl: { type: String, required: true, default: '' },
		modules: { type: [String], required: true, default: [] },
		lastfmUsername: { type: String, required: false, default: '' },
		defaultCommandOptions: {
			type: [
				{
					name: { type: String, required: true },
					modifiedUserCooldown: { type: Number, required: true },
					modifiedChannelCooldown: { type: Number, required: true },
					modifiedPermissions: { type: [String], required: true },
					enabled: { type: Boolean, required: true },
					chatMode: { type: String, required: true },
				},
			],
			required: true,
			default: [],
		},
		premium: {
			type: {
				orders: {
					type: [
						{
							id: { type: String, required: true },
							createdAt: { type: Date, required: true },
							expiresAt: { type: Date, required: true },
							duration: { type: Number, required: true },
							email: { type: String, required: true },
							status: { type: String, required: true },
						},
					],
				},
			},
			required: true,
			default: { orders: [] },
		},
	},
	{
		timestamps: true,
	}
);

// Models are instantiated per package instead of in this common package
// export const ChannelModel = models[ModelName] || model<IChannel>(ModelName, ChannelSchema);
