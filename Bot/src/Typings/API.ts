// {"username":"AuroR6S","userid":"94568374","channel":"KattahSalt","channelid":"175316629","hidden":false,"subscribed":true,"followedAt":"2021-11-05T17:19:11Z","meta":{"type":"gift","tier":"1","dnr":false,"endsAt":"2022-02-13T00:42:42Z","renewsAt":null,"gift":{"isgift":true,"date":"2022-01-13T00:42:43.19561918Z","id":"451178431","name":"schweinchenxD"}},"cumulative":{"months":1,"elapsed":1,"remaining":30,"end":"2022-02-13T00:42:42Z","start":"2022-01-13T00:42:43Z"},"streak":{"months":1,"elapsed":1,"remaining":30,"end":"2022-02-13T00:42:42Z","start":"2022-01-13T00:42:43Z"}}

export type IvrFiSubage = {
	user: {
		id: string;
		login: string;
		displayName: string;
	};
	channel: {
		id: string;
		login: string;
		displayName: string;
	};
	statusHidden: boolean;
	followedAt: string;
	streak: {
		elapsedDays: number;
		daysRemaining: number;
		months: number;
		end: string;
		start: string;
	};
	cumulative: {
		elapsedDays: number;
		daysRemaining: number;
		months: number;
		end: string;
		start: string;
	};
	meta: {
		type: string;
		tier: string;
		endsAt: string;
		renewsAt: string | null;
		giftMeta: {
			giftDate: string;
			gifter: {
				id: string;
				login: string;
				displayName: string;
			};
		};
	};
};

export type TMIChatters = {
	_links: any;
	chatter_count: number;
	chatters: {
		broadcaster: string[];
		vips: string[];
		moderators: string[];
		staff: string[];
		admins: string[];
		global_mods: string[];
		viewers: string[];
	};
};

// from https://github.com/SevenTV/EventAPI#emoteeventupdate
export interface EmoteEventUpdate {
	// The channel this update affects.
	channel: string;
	// The ID of the emote.
	emote_id: string;
	// The name or channel alias of the emote.
	name: string;
	// The action done.
	action: 'ADD' | 'REMOVE' | 'UPDATE';
	// The user who caused this event to trigger.
	actor: string;
	// An emote object. Null if the action is "REMOVE".
	emote?: ExtraEmoteData;
}

interface ExtraEmoteData {
	// Original name of the emote.
	name: string;
	// The visibility bitfield of this emote.
	visibility: number;
	// The MIME type of the images.
	mime: string;
	// The TAGs on this emote.
	tags: string[];
	// The widths of the images.
	width: [number, number, number, number];
	// The heights of the images.
	height: [number, number, number, number];
	// The animation status of the emote.
	animated: boolean;
	// Infomation about the uploader.
	owner: {
		// 7TV ID of the owner.
		id: string;
		// Twitch ID of the owner.
		twitch_id: string;
		// Twitch DisplayName of the owner.
		display_name: string;
		// Twitch Login of the owner.
		login: string;
	};
	// The first string in the inner array will contain the "name" of the URL, like "1" or "2" or "3" or "4"
	// or some custom event names we haven't figured out yet such as "christmas_1" or "halloween_1" for special versions of emotes.
	// The second string in the inner array will contain the actual CDN URL of the emote. You should use these URLs and not derive URLs
	// based on the emote ID and size you want, since in future we might add "custom styles" and this will allow you to easily update your app,
	// and solve any future breaking changes you apps might receive due to us changing.
	urls: [[string, string]];
}

export interface SevenTVEmote {
	id: string;
	name: string;
	owner: {
		id: string;
		twitch_id: string;
		login: string;
		display_name: string;
		role: {
			id: string;
			name: string;
			position: number;
			color: number;
			allowed: number;
			denied: number;
			default: boolean;
		};
	};
	visibility: number;
	visibility_simple: string[];
	mime: string;
	status: number;
	tags: string[];
	width: [number, number, number, number];
	height: [number, number, number, number];
	urls: [[string, string]];
}

export interface SevenTVGQLQueryUser {
	data: {
		user: {
			id: string;
			email: string;
			editors: Array<{
				twitch_id: string;
			}>;
			emote_slots: number;
		};
	};
}

export interface SevenTVGQLMutationAddChannelEmote {
	data: {
		addChannelEmote: {
			name: string;
			emote_slots: number;
			emotes: Array<{
				name: string;
			}>;
		};
	};
}

export interface SevenTVGQLMutationEditChannelEmote {
	data: {
		editChannelEmote: {
			name: string;
			emote_slots: number;
			emotes: Array<{
				name: string;
			}>;
		};
	};
}

export interface SevenTVGQLMutationRemoveChannelEmote {
	data: {
		removeChannelEmote: {
			name: string;
			emote_slots: number;
			emotes: Array<{
				name: string;
			}>;
		};
	};
}

export interface SevenTVRESTUserResponse {
	id: string;
	twitch_id: string;
	login: string;
	display_name: string;
	role: {
		id: string;
		name: string;
		position: number;
		color: number;
		allowed: number;
		denied: number;
	};
	profile_picture_id: string | null;
}

export interface UnshortenMeResponse {
	requested_url: string;
	success: boolean;
	resolved_url: string;
	usage_count: number;
	remaining_calls: number;
}

interface Badge {
	setID: string;
	title: string;
	description: string;
	version: string;
}

interface Roles {
	isAffiliate: boolean;
	isPartner: boolean;
	isStaff: boolean | null;
}

interface ChatSettings {
	chatDelayMs: number;
	followersOnlyDurationMinutes: number | null;
	slowModeDurationSeconds: number | null;
	blockLinks: boolean;
	isSubscribersOnlyModeEnabled: boolean;
	isEmoteOnlyModeEnabled: boolean;
	isFastSubsModeEnabled: boolean;
	isUniqueChatModeEnabled: boolean;
	requireVerifiedAccount: boolean;
	rules: string[];
}

interface LastBroadcast {
	startedAt: string;
	title: string | null;
}

interface Panel {
	id: string;
}

export interface IvrFiUser {
	banned: boolean;
	displayName: string;
	login: string;
	id: string;
	bio: string;
	follows: any; // Assuming follows can be any type
	followers: number;
	profileViewCount: any; // Assuming profileViewCount can be any type
	panelCount: number;
	chatColor: string;
	logo: string;
	banner: string;
	verifiedBot: any; // Assuming verifiedBot can be any type
	createdAt: string;
	updatedAt: string;
	emotePrefix: string;
	roles: Roles;
	badges: Badge[];
	chatterCount: number;
	chatSettings: ChatSettings;
	stream: any; // Assuming stream can be any type
	lastBroadcast: LastBroadcast;
	panels: Panel[];
}

// {"status":200,"banned":false,"displayName":"AuroR6S","login":"auror6s","id":"94568374","bio":"https://mrauro.dev/","chatColor":"#008000","logo":"https://static-cdn.jtvnw.net/jtv_user_pictures/73cca255-1a58-40a8-8cb9-983aa9392372-profile_image-600x600.png","partner":false,"affiliate":true,"bot":true,"createdAt":"2015-06-26T23:08:12.811356Z","updatedAt":"2022-02-06T02:55:25.168747Z","chatSettings":{"chatDelayMs":0,"followersOnlyDurationMinutes":null,"slowModeDurationSeconds":null,"blockLinks":false,"isSubscribersOnlyModeEnabled":false,"isEmoteOnlyModeEnabled":false,"isFastSubsModeEnabled":false,"isUniqueChatModeEnabled":false,"requireVerifiedAccount":false,"rules":["no weebs"]},"badge":[],"roles":{"isAffiliate":true,"isPartner":false,"isSiteAdmin":null,"isStaff":null},"settings":{"preferredLanguageTag":"EN"},"panels":[{"id":"112059529"},{"id":"112059545"},{"id":"112059546"},{"id":"112059539"},{"id":"112059547"},{"id":"112059550"},{"id":"112059485"},{"id":"112059456"},{"id":"112059521"},{"id":"112059513"}]}
// export interface IvrFiUser {
// 	status: number;
// 	banned: boolean;
// 	displayName: string;
// 	login: string;
// 	id: string;
// 	bio: string;
// 	chatColor: string;
// 	logo: string;
// 	partner: boolean;
// 	affiliate: boolean;
// 	bot: boolean;
// 	createdAt: string;
// 	updatedAt: string;
// 	chatSettings: {
// 		chatDelayMs: number | null;
// 		followersOnlyDurationMinutes: number | null;
// 		slowModeDurationSeconds: number | null;
// 		blockLinks: boolean | null;
// 		isSubscribersOnlyModeEnabled: boolean | null;
// 		isEmoteOnlyModeEnabled: boolean | null;
// 		isFastSubsModeEnabled: boolean | null;
// 		isUniqueChatModeEnabled: boolean | null;
// 		requireVerifiedAccount: boolean | null;
// 		rules: string[] | null;
// 	};
// 	badge: string[];
// 	roles: {
// 		isAffiliate: boolean;
// 		isPartner: boolean;
// 		isSiteAdmin: boolean | null;
// 		isStaff: boolean | null;
// 	};
// 	settings: {
// 		preferredLanguageTag: string;
// 	};
// 	panels: {
// 		id: string;
// 	}[];
// }

export interface LogsIvrFiChannels {
	channels: {
		userID: string;
		name: string;
	}[];
}

export interface ChattersResponse {
	chatter_count: number;
	chatters: {
		broadcaster: string[];
		vips: string[];
		moderators: string[];
		staff: string[];
		admins: string[];
		global_mods: string[];
		viewers: string[];
	};
}

export interface SevenTVEmoteV3 {
	id: string;
	name: string;
	flags: number;
	timestamp: string;
	actor_id: any;
	data: {
		id: string;
		name: string;
		flags: number;
		lifecycle: number;
		state: string[];
		listed: boolean;
		animated: boolean;
		owner: {
			id: string;
			username: string;
			display_name: string;
			avatar_url: string;
			style: any;
			roles: string[];
		};
		host: {
			url: string;
			files: {
				name: string;
				static_name: string;
				width: number;
				height: number;
				frame_count: number;
				size: number;
				format: string;
			}[];
		};
	};
}

export interface SevenTVGlobalEmotesV3 {
	id: string;
	name: string;
	flags: number;
	tags: any[];
	immutable: boolean;
	privileged: boolean;
	emotes: SevenTVEmoteV3[];
	emote_count: number;
	capacity: number;
	owner: Object;
}
/*
{
	"id": "94568374",
	"platform": "TWITCH",
	"username": "auror6s",
	"display_name": "AuroR6S",
	"linked_at": 1617043555000,
	"emote_capacity": 1000,
	"emote_set_id": null,
	"emote_set": {
		"id": "630e742f3cfad7b708c476cc",
		"name": "Emote Set",
		"flags": 0,
		"tags": [],
		"immutable": false,
		"privileged": false,
		"emotes": [
			{
				"id": "60ae480e5d3fdae583b37042",
				"name": "Hmmm",
				"flags": 0,
				"timestamp": 1662416308715,
				"actor_id": "629d77a20e60c6d53da64e38",
				"data": {
					"id": "60ae480e5d3fdae583b37042",
					"name": "Hmmm",
					"flags": 0,
					"lifecycle": 3,
					"state": [
						"PERSONAL",
						"LISTED"
					],
					"listed": true,
					"animated": false,
					"owner": {
						"id": "60ae381cb2ecb01505048cbd",
						"username": "inlawwww",
						"display_name": "inlawwww",
						"avatar_url": "//cdn.7tv.app/user/60ae381cb2ecb01505048cbd/av_63daaa9334d88e3a0956111d/3x_static.webp",
						"style": {},
						"roles": [
							"62b48deb791a15a25c2a0354"
						]
					},
			...
				"user": {
		"id": "60622063452cea4685e077fb",
		"username": "auror6s",
		"display_name": "AuroR6S",
		"created_at": 1617043555000,
		"avatar_url": "//cdn.7tv.app/pp/60622063452cea4685e077fb/f4b3a99cdd7e404099dfcad5514b60d1",
		"biography": "Bot Developerhttps://mrauro.dev/",
		"style": {
			"color": 401323775
		},
		"editors": [
			{
				"id": "60de6a4ee03c0b978d8c2af7",
				"permissions": 17,
				"visible": true,
				"added_at": 1657657509728
			},
			{
				"id": "61f49af297d743f388012ecf",
				"permissions": 17,
				"visible": true,
				"added_at": 1657657509728
			},
			{
				"id": "60532eaab4d31e459f727bcd",
				"permissions": 17,
				"visible": true,
				"added_at": 1658121434163
			},
			{
				"id": "60b6c31bf6632c3f681bfc58",
				"permissions": 1,
				"visible": true,
				"added_at": 1662410735955
			},
			{
				"id": "629d77a20e60c6d53da64e38",
				"permissions": 1,
				"visible": true,
				"added_at": 1662411043193
			}
		],
		"roles": [
			"60b3f1ea886e63449c5263b1",
			"62b48deb791a15a25c2a0354"
		],
		"connections": [
			{
				"id": "94568374",
				"platform": "TWITCH",
				"username": "auror6s",
				"display_name": "AuroR6S",
				"linked_at": 1617043555000,
				"emote_capacity": 1000,
				"emote_set_id": null,
				"emote_set": {
					"id": "630e742f3cfad7b708c476cc",
					"name": "",
					"flags": 0,
					"tags": [],
					"immutable": false,
					"privileged": false,
					"capacity": 0,
					"owner": null
				}
			},
			{
				"id": "UCreRsdm2o6V4C9i7AQzWqIA",
				"platform": "YOUTUBE",
				"username": "UCreRsdm2o6V4C9i7AQzWqIA",
				"display_name": "",
				"linked_at": 1617043555000,
				"emote_capacity": 300,
				"emote_set_id": null,
				"emote_set": {
					"id": "630e742f3cfad7b708c476cc",
					"name": "",
					"flags": 0,
					"tags": [],
					"immutable": false,
					"privileged": false,
					"capacity": 0,
					"owner": null
				}
			},
			{
				"id": "183230486762618889",
				"platform": "DISCORD",
				"username": "Auro#6177",
				"display_name": "Auro",
				"linked_at": 1658609837193,
				"emote_capacity": 0,
				"emote_set_id": null,
				"emote_set": {
					"id": "630e742f3cfad7b708c476cc",
					"name": "",
					"flags": 0,
					"tags": [],
					"immutable": false,
					"privileged": false,
					"capacity": 0,
					"owner": null
				}
			},
			{
				"id": "1647653",
				"platform": "KICK",
				"username": "auror6s",
				"display_name": "AuroR6S",
				"linked_at": 1687327770213,
				"emote_capacity": 600,
				"emote_set_id": null,
				"emote_set": null
			}
		]
	}
}
*/
export interface SevenTVUserV3 {
	id: string;
	platform: string;
	username: string;
	display_name: string;
	linked_at: number;
	emote_capacity: number;
	emote_set_id: any;
	emote_set: {
		id: string;
		name: string;
		flags: number;
		tags: any[];
		immutable: boolean;
		privileged: boolean;
		emotes: SevenTVEmoteV3[];
		emote_count: number;
		capacity: number;
		owner: Object;
	};
	user: {
		id: string;
		username: string;
		display_name: string;
		created_at: number;
		avatar_url: string;
		biography: string;
		style: {
			color: number;
		};
		editors: any[];
		roles: string[];
		connections: {
			id: string;
			platform: string;
			username: string;
			display_name: string;
			linked_at: number;
			emote_capacity: number;
			emote_set_id: any;
			emote_set: any;
		}[];
	};
}
