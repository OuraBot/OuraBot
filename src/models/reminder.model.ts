import { connection, model, Schema } from 'mongoose';

delete connection.models['Reminder'];

export interface IReminder extends Schema {
    username: String;
    message: String;
    timestamp: Date;
    author: String;
    _id: string;
}

const schema = new Schema<IReminder>({
    username: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, required: true },
    author: { type: String, required: true },
});

export const Reminder = model<IReminder>('Reminder', schema);
