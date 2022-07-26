import ob from '..';
import { TwitchUserId } from '../Typings/Twitch';
import { SQLReminder } from './SQLite';

export class ReminderManager {
	async getReminders(recipientId: TwitchUserId): Promise<Reminder[]> {
		let reminders = await ob.sqlite.query(`SELECT * FROM "reminders" WHERE "recipientId" = ?`, [recipientId]);
		return reminders.map((reminder: SQLReminder) => {
			return new Reminder(reminder);
		});
	}

	async createReminder(authorId: TwitchUserId, recepientId: TwitchUserId, message: string, user: string): Promise<Reminder> {
		const date = new Date().toISOString();

		await ob.sqlite.query(`INSERT INTO "reminders" ("AUTHORID", "RECIPIENTID", "MESSAGE", "DATE", "USER") VALUES (?, ?, ?, ?, ?)`, [
			authorId,
			recepientId,
			message,
			date,
			user,
		]);

		const reminder = await ob.sqlite.query(`SELECT * FROM "reminders" WHERE "AUTHORID" = ? AND "RECIPIENTID" = ? AND "MESSAGE" = ? AND "DATE" = ? AND "USER" = ?`, [
			authorId,
			recepientId,
			message,
			date,
			user,
		]);

		return new Reminder(reminder[0]);
	}
}

export class Reminder {
	authorId: string;
	recipientId: string;
	message: string;
	date: Date;
	user: string;
	id: string;

	constructor(sqlReminder: SQLReminder) {
		this.authorId = sqlReminder.authorId;
		this.recipientId = sqlReminder.recipientId;
		this.message = sqlReminder.message;
		this.date = new Date(sqlReminder.date);
		this.id = sqlReminder.id;
		this.user = sqlReminder.user;
	}

	delete() {
		ob.sqlite.db.run(`DELETE FROM "reminders" WHERE "ID" = ?`, [this.id], (err: any) => {
			if (err) {
				throw err;
			}
		});
	}
}
