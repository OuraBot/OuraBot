import axios from 'axios';
import { connection, model, Schema, SchemaTimestampsConfig } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

delete connection.models['Usage'];

export interface IUsage extends Schema, SchemaTimestampsConfig {
    user: string;
    channel: string;
    command: string;
    success: boolean;
    args: string[];
    response: string;
}

const schema = new Schema<IUsage>(
    {
        user: { type: String, required: true },
        channel: { type: String, required: true },
        command: { type: String, required: true },
        success: { type: Boolean, required: true },
        args: { type: [String], required: true },
        response: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

export const Usage = model<IUsage>('Usage', schema);

export function logCommandUse(user: string, channel: string, command: string, success: boolean, args: string[], response: string) {
    axios.post(process.env.DISCORD_MIRROR_WEBHOOK, {
        embeds: [
            {
                author: {
                    name: channel,
                },
                fields: [
                    {
                        name: `${user}:`,
                        value: `${command} ${args.join(' ')}`,
                    },
                    {
                        name: 'Response:',
                        value: response,
                    },
                ],
                timestamp: new Date(),
                color: success ? 0x00ff00 : 0xff0000,
            },
        ],
    });
    return new Usage({
        user,
        channel,
        command,
        success,
        args,
        response,
    }).save();
}
