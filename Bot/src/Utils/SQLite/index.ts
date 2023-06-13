import { Database } from 'sqlite3';
import { TwitchUserId } from '../../Typings/Twitch';
import { Afk, AfkStatuses } from '../Afk';

export class SQLite {
	public db: Database;

	constructor(path: string) {
		this.db = new Database(path);
		this.db.run(`CREATE TABLE IF NOT EXISTS "messages" ( "userId" TEXT NOT NULL, "channelId" TEXT NOT NULL, "message" TEXT NOT NULL, "date" DATETIME NOT NULL )`);
		this.db.run(
			`CREATE TABLE IF NOT EXISTS "usages" ( "userId" TEXT NOT NULL, "channelId" TEXT NOT NULL, "command" TEXT NOT NULL, "message" TEXT NOT NULL, "success" BOOLEAN NOT NULL, "response" TEXT NOT NULL, "date" DATETIME NOT NULL )`
		);
		this.db.run(
			`CREATE TABLE IF NOT EXISTS "afks" ( "userId" TEXT NOT NULL, "status" TEXT NOT NULL, "message" TEXT NOT NULL, "date" DATETIME NOT NULL, "pending" BOOLEAN NOT NULL, "uuid" TEXT NOT NULL )`
		);
		this.db.run(
			`CREATE TABLE IF NOT EXISTS "reminders" ( "authorId" TEXT NOT NULL, "recipientId" TEXT NOT NULL, "message" TEXT NOT NULL, "date" DATETIME NOT NULL, "user" TEXT NOT NULL, "id" INTEGER PRIMARY KEY AUTOINCREMENT )`
		);
		this.db.run(`CREATE TABLE IF NOT EXISTS "blockedusers" ( "userId" TEXT NOT NULL, "commands" TEXT[] NOT NULL )`);
		this.db.run(`CREATE TABLE IF NOT EXISTS "users" ( "userId" TEXT NOT NULL UNIQUE PRIMARY KEY, "hideLogs" BOOLEAN NOT NULL, "firstSeen" DATETIME NOT NULL )`);
		this.db.run(
			`CREATE TABLE IF NOT EXISTS "suggestions" ( "login" TEXT NOT NULL, "channel" TEXT NOT NULL, "id" INTEGER PRIMARY KEY AUTOINCREMENT, "message" TEXT NOT NULL, "status" TEXT NOT NULL, "userId" TEXT NOT NULL, "channelId" TEXT NOT NULL, "date" DATETIME NOT NULL )`
		);
	}

	public async addMessage(userId: string, channelId: string, message: string): Promise<void> {
		this.db.run(
			`INSERT INTO "messages" ("USERID", "CHANNELID", "MESSAGE", "DATE") VALUES (?, ?, ?, ?)`,
			[userId, channelId, message, new Date().toISOString()],
			(err) => {
				if (err) {
					throw err;
				}
			}
		);
	}

	public async logUsage(userId: string, channelId: string, command: string, message: string, success: boolean, response: string): Promise<void> {
		this.db.run(
			`INSERT INTO "usages" ("USERID", "CHANNELID", "COMMAND", "MESSAGE", "SUCCESS", "RESPONSE", "DATE") VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[userId, channelId, command, message, success, response, new Date().toISOString()],
			(err) => {
				if (err) {
					throw err;
				}
			}
		);
	}

	public async query(query: string, params: any[] = []): Promise<any[]> {
		return new Promise((resolve, reject) => {
			this.db.all(query, params, (err, rows) => {
				if (err) {
					reject(err);
				} else {
					resolve(rows);
				}
			});
		});
	}

	public async getBlockedUsers(): Promise<SQLBlockUser[]> {
		return this.query(`SELECT * FROM "blockedusers"`);
	}

	public async getUser(userId: TwitchUserId): Promise<SQLUser | undefined> {
		return (await this.query(`SELECT * FROM "users" WHERE "userId" = ?`, [userId]))[0];
	}

	public async createUser(userId: TwitchUserId, firstSeen: Date): Promise<void> {
		this.db.run(`INSERT OR IGNORE INTO "users" ("userId", "hideLogs", "firstSeen") VALUES (?, ?, ?)`, [userId, false, firstSeen.toISOString()], (err) => {
			if (err) {
				throw err;
			}
		});
	}

	public async updateUser(userId: TwitchUserId, hideLogs: boolean): Promise<void> {
		this.db.run(`UPDATE "users" SET "hideLogs" = ? WHERE "userId" = ?`, [hideLogs, userId], (err) => {
			if (err) {
				throw err;
			}
		});
	}

	public async createSuggestion(
		userId: TwitchUserId,
		channelId: string,
		message: string,
		status: 'pending' | 'approved' | 'denied' | 'dismissed',
		login: string,
		channel: string
	): Promise<number> {
		const date = new Date().toISOString();

		this.db.run(`INSERT INTO "suggestions" ("userId", "channelId", "message", "status", "login", "channel", "date") VALUES (?, ?, ?, ?, ?, ?, ?)`, [
			userId,
			channelId,
			message,
			status,
			login,
			channel,
			date,
		]);

		return (await this.query(`SELECT "id" FROM "suggestions" WHERE "date" = ? AND "userId" = ?`, [date, userId]))[0].id;
	}
}

export type SQLMessage = {
	userId: string;
	channelId: string;
	message: string;
	date: string;
};

export type SQLUsage = {
	userId: string;
	channelId: string;
	command: string;
	message: string;
	success: boolean;
	response: string;
	date: string;
};

export type SQLAfk = {
	userId: string;
	status: string;
	message: string;
	date: string;
	pending: boolean;
	uuid: string;
};

export type SQLReminder = {
	authorId: string;
	recipientId: string;
	message: string;
	date: string;
	user: string;
	id: string;
};

export type SQLBlockUser = {
	userId: string;
	commands: string[];
};

export type SQLUser = {
	userId: string;
	hideLogs: boolean;
	firstSeen: string;
};

export type SQLSuggestion = {
	login: string;
	channel: string;
	id: number;
	message: string;
	status: 'pending' | 'approved' | 'denied' | 'dismissed';
	userId: string;
	channelId: string;
	date: string;
};
