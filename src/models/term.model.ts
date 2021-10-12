import { connection, model, Schema } from 'mongoose';

delete connection.models['Term'];

export interface ITerm extends Schema {
    channel: string;
    regex: string;
    response: string;
    ignorepermissions?: boolean;
}

const schema = new Schema<ITerm>({
    channel: { type: String, required: true },
    regex: { type: String, required: true },
    response: { type: String, required: true },
    ignorepermissions: { type: Boolean, required: false },
});

export const Term = model<ITerm>('Term', schema);
