import dotenv from 'dotenv';
dotenv.config();

export class EnvironmentVariables {
	public static readonly TWITCH_CLIENT_ID: string = process.env.TWITCH_CLIENT_ID;
	public static readonly TWITCH_CLIENT_SECRET: string = process.env.TWITCH_CLIENT_SECRET;
	public static readonly MONGO_URI: string = process.env.MONGO_URI;
	public static readonly DEBUG: boolean = process.env.DEBUG === 'true';
	public static readonly SEVENTV_AUTH: string = process.env.SEVENTV_AUTH;
	public static readonly HASTE_KEY: string = process.env.HASTE_KEY;
	public static readonly HASTE_URL: string = process.env.HASTE_URL;
	public static readonly JWT_SECRET: string = process.env.JWT_SECRET;
}
