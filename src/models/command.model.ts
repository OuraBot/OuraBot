import { Schema, model, connection } from 'mongoose';

delete connection.models['CustomCommand'];

export interface ICustomCommand extends Schema {
    channel: string;
    command: string;
    response: string;
    userCooldown: number;
    channelCooldown: number;
}

const schema = new Schema<ICustomCommand>({
    channel: { type: String, required: true },
    command: { type: String, required: true },
    response: { type: String, required: true },
    userCooldown: { type: Number, required: true },
    channelCooldown: { type: Number, required: true },
});

export const CustomCommand = model<ICustomCommand>('CustomCommand', schema);
