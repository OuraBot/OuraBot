import { connection, model, Schema, SchemaTimestampsConfig } from 'mongoose';

delete connection.models['Error'];

export interface IError extends Schema, SchemaTimestampsConfig {
    args: string[];
    error: string;
    id: number;
}

const schema = new Schema<IError>(
    {
        args: { type: Array, required: true },
        error: { type: String, required: true },
        id: { type: Number, min: 1, required: true },
    },
    {
        timestamps: true,
    }
);

export const ErrorModel = model<IError>('Error', schema);
