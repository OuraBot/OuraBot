export class CacheTimes {
	public static readonly TMIChatters: number = 60 * 5;
	public static readonly ChannelModules: number = 60 * 5;
	public static readonly ChannelInfo: number = 60 * 5;
}

export class SevenTVGQLQueries {
	public static readonly getUser: string = `
		query GetUser($id: String!) {
			user(id: $id) {
				id
				editors {
					twitch_id
				}
				emote_slots
			}
		}`;

	public static readonly addEmote: string = `
		mutation AddChannelEmote($ch: String!, $em: String!, $re: String!) {
			addChannelEmote(channel_id: $ch, emote_id: $em, reason: $re) {
				emote_slots
				emotes {
					name
				}
			}
		}`;

	public static readonly removeEmote: string = `
		mutation RemoveChannelEmote($ch: String!, $em: String!) {
			removeChannelEmote(channel_id: $ch, emote_id: $em) {
				emote_slots
				emotes {
					name
				}
			}
		}`;

	public static readonly editEmote: string = `
		mutation EditChannelEmote($ch: String!, $em: String!, $data: ChannelEmoteInput!, $re: String) {
			editChannelEmote(channel_id: $ch, emote_id: $em, data: $data, reason: $re) {
				emote_slots
				emotes {
					name
				}
			}
		}`;
}

export const SevenTVGQLUrl: string = 'https://api.7tv.app/v2/gql';
