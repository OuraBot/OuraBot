import { Schema, model, connection } from 'mongoose';
import { redis } from '../index';

delete connection.models['Error'];

export interface IError extends Schema {
    channel: string;
    user: string;
    bot: string;
    message: string;
    command: string;
    error: string;
    completed: boolean;
    id: number;
}

const schema = new Schema<IError>({
    channel: { type: String, required: true },
    user: { type: String, required: true },
    bot: { type: String, required: true },
    message: { type: String, required: true },
    command: { type: String, required: true },
    error: { type: String, required: true },
    completed: { type: Boolean, default: false },
    id: { type: Number, unique: true, min: 1, required: true },
});

export const ErrorModel = model<IError>('Error', schema);

export async function createNewError(channel: string, user: string, message: string, command: string, _error: string): Promise<Number> {
    let counterData = Number(await redis.get(`ob:counter`));
    if (!counterData) {
        await redis.set(`ob:counter`, 1);
        counterData = 1;
    } else {
        await redis.incr(`ob:counter`);
    }

    const newError = new ErrorModel({
        channel: channel,
        user: user,
        bot: `${process.env.CLIENT_USERNAME}`,
        message: message,
        command: command,
        error: _error,
        completed: false,
        id: counterData,
    });

    newError.save();

    return counterData;
}
