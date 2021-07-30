import { Schema, model, connection } from 'mongoose';

delete connection.models['Clip'];

export interface IClip extends Schema {
    channel: string;
    url: string;
}

const schema = new Schema<IClip>({
    channel: { type: String, required: true },
    url: { type: String, required: true },
});

export const Clip = model<IClip>('Clip', schema);
