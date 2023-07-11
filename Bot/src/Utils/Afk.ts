import ob from '..';
import { TwitchUserId } from '../Typings/Twitch';
import { SQLAfk } from './SQLite';

export class AfkManager {
	async getAfks(userId: TwitchUserId): Promise<Afk[]> {
		let afks = await ob.sqlite.query(`SELECT * FROM "afks" WHERE "USERID" = ?`, [userId]);
		return afks.map((afk: SQLAfk) => {
			return new Afk(afk);
		});
	}

	async getAllAfks(): Promise<Afk[]> {
		let afks = await ob.sqlite.query(`SELECT * FROM "afks"`);
		return afks.map((afk: SQLAfk) => {
			return new Afk(afk);
		});
	}

	async createAfk(userId: TwitchUserId, status: AfkStatuses, message: string): Promise<Afk> {
		let existingAfks = await this.getAfks(userId);
		existingAfks?.forEach((afk) => {
			afk.delete();
		});

		let date = new Date();
		let uuid = ob.utils.generateUUID();
		let pending = false;
		ob.sqlite.db.run(
			`INSERT INTO "afks" ("USERID", "STATUS", "MESSAGE", "DATE", "PENDING", "UUID") VALUES (?, ?, ?, ?, ?, ?)`,
			[userId, status, message, date.toISOString(), pending, uuid],
			(err: any) => {
				if (err) {
					throw err;
				}
			}
		);

		let afk = await ob.sqlite.query(`SELECT * FROM "afks" WHERE "UUID" = ? LIMIT 1`, [uuid]);
		return new Afk(afk[0]);
	}
}

export class Afk {
	userId: TwitchUserId;
	status: AfkStatuses;
	message: string;
	time: Date;
	pending: boolean;
	uuid: string;

	constructor(sqlAfk: SQLAfk) {
		this.userId = sqlAfk.userId;
		this.status = sqlAfk.status as AfkStatuses;
		this.message = sqlAfk.message;
		this.time = ob.utils.SQLiteDateToDate(sqlAfk.date);
		this.pending = sqlAfk.pending;
		this.uuid = sqlAfk.uuid;
	}

	pendDeletion(): void {
		if (this.pending) this.delete();

		ob.sqlite.db.run(`UPDATE "afks" SET "PENDING" = ? WHERE "UUID" = ?`, [true, this.uuid], (err: any) => {
			if (err) {
				throw err;
			}
		});
		this.pending = true;
		setTimeout(
			() => {
				if (this.pending) {
					this.delete();
				}
			},
			1000 * 60 * 5
		);
	}

	unpendDeletion(): void {
		this.pending = false;
		ob.sqlite.db.run(`UPDATE "afks" SET "PENDING" = ? WHERE "UUID" = ?`, [false, this.uuid], (err: any) => {
			if (err) {
				throw err;
			}
		});
	}

	delete(): void {
		ob.sqlite.db.run(`DELETE FROM "afks" WHERE "UUID" = ?`, [this.uuid], (err: any) => {
			if (err) {
				throw err;
			}
		});
	}
}

export type AfkStatuses = 'afk' | 'brb' | 'lurk' | 'gn' | 'food';
