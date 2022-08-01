import { connection, model, Schema, models } from 'mongoose';
const ModelName = 'SuspiciousUser';

export interface _ISusUser extends Schema {
	login: string;
	id: string;
	message: string;
	reason: string;
	spottedIn: string;
	spottedAt: Date;
}

export let ISusUser: _ISusUser;

const SusUserSchema = new Schema<typeof ISusUser>(
	{
		login: { type: String, required: true },
		id: { type: String, required: true },
		message: { type: String, required: true },
		reason: { type: String, required: true },
		spottedIn: { type: String, required: true },
		spottedAt: { type: Date, required: true },
	},
	{
		timestamps: true,
	}
);

export const SusUserModel = models[ModelName] || model<typeof ISusUser>(ModelName, SusUserSchema);
