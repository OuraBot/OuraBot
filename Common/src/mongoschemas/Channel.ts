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

export interface ModuleKey {
	smartemoteonly: {
		enabled: boolean;
		timeout: number; // in seconds, 0 is delete
	};
}

export type Modules = {
	[K in keyof ModuleKey]: ModuleKey[K];
};

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
	// Default command options
	defaultCommandOptions: DefaultCommandOption[];
	// Lastfm username
	lastfmUsername: string;
	// Referrer
	referrer: string;
	// Moderation modules
	modules: Modules;
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
	// Phrases
	phrases: {
		name: string;
		response: {
			type: 'timeout' | 'ban' | 'message';
			value: string;
			reply: boolean;
		};
		trigger: {
			value: string;
			regex: boolean;
		};
		cooldowns: {
			user: number;
			channel: number;
		};
		// permissions: string[];
	}[];
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
		lastfmUsername: { type: String, required: false, default: '' },
		referrer: { type: String, required: false, default: '' },
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
		modules: {
			type: {
				smartemoteonly: {
					type: {
						enabled: { type: Boolean },
						timeout: { type: Number },
					},
				},
			},
			required: true,
			default: { smartemoteonly: { enabled: false, timeout: 0 } },
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
		phrases: {
			type: [
				{
					name: { type: String, required: true },
					response: {
						type: {
							type: String,
							required: true,
							enum: ['timeout', 'ban', 'message'],
						},
						value: { type: String, required: true },
						reply: { type: Boolean, required: true },
					},
					trigger: {
						value: { type: String, required: true },
						regex: { type: Boolean, required: true },
					},
					cooldowns: {
						user: { type: Number, required: true },
						channel: { type: Number, required: true },
					},
					// permissions: { type: [String], required: true },
				},
			],
			required: true,
			default: [],
		},
	},
	{
		timestamps: true,
	}
);

// Models are instantiated per package instead of in this common package
// export const ChannelModel = models[ModelName] || model<IChannel>(ModelName, ChannelSchema);
