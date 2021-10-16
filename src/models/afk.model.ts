import { connection, model, Schema } from 'mongoose';

delete connection.models['Afk'];

export enum Status {
    SLEEP = 'SLEEPING',
    LURK = 'LURKING',
    AFK = 'AFK',
    EATING = 'EATING',
}

export interface IAfk extends Schema {
    user: string;
    message: string;
    status: Status;
    timestamp: Date;
    _id: string;
}

const schema = new Schema<IAfk>({
    user: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, required: true },
    timestamp: { type: Date, required: true },
});

export const Afk = model<IAfk>('Afk', schema);
