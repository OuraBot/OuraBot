import { connection, model, Schema } from 'mongoose';

delete connection.models['Channel'];

export interface IChannel extends Schema {
    channel: string;
    bot: string;
    priority: number;
}

const schema = new Schema<IChannel>({
    channel: { type: String, required: true },
    bot: { type: String, required: true },
    priority: { type: Number, required: false },
});

export const Channel = model<IChannel>('Channel', schema);
