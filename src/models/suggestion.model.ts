import { Schema, model, connection } from 'mongoose';
import { redis } from '../index';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

delete connection.models['Suggestion'];

export interface ISuggestion extends Schema {
    user: string;
    message: string;
    completed: boolean;
    id: number;
}

const schema = new Schema<ISuggestion>({
    user: { type: String, required: true },
    message: { type: String, required: true },
    completed: { type: Boolean, default: false },
    id: { type: Number, unique: true, min: 1, required: true },
});

export const SuggestionModel = model<ISuggestion>('Suggestion', schema);

export async function createNewSuggestion(user: string, message: string): Promise<Number> {
    let counterData = Number(await redis.get(`ob:counter`));
    if (!counterData) {
        await redis.set(`ob:counter`, 1);
        counterData = 1;
    } else {
        await redis.incr(`ob:counter`);
    }

    axios.post(process.env.DISCORD_WEBHOOK, {
        embeds: [
            {
                title: `OuraBot Suggestion - Suggestion ID #${counterData}`,
                description: `${message}`,
                color: 0x00ff00,
                author: {
                    name: `Suggestion by ${user}`,
                },
                timestamp: new Date(),
            },
        ],
    });

    const newError = new SuggestionModel({
        user: user,
        message: message,
        completed: false,
        id: counterData,
    });

    newError.save();

    return counterData;
}
