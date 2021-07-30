import { Schema, model, connection } from 'mongoose';

delete connection.models['Channel'];

export interface IChannel extends Schema {
    channel: string;
    bot: string;
    [x: string]: any;
}

const schema = new Schema<IChannel>({
    channel: { type: String, required: true },
    bot: { type: String, required: true },
});

export const Channel = model<IChannel>('Channel', schema);
