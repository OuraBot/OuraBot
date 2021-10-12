import { connection, model, Schema } from 'mongoose';
import { moduleEnum } from '../commands/modmodule';

delete connection.models['Module'];

export interface IModule extends Schema {
    channel: string;
    module: moduleEnum;
    timeout: number;
}

const schema = new Schema<IModule>({
    channel: { type: String, required: true },
    module: { type: String, required: true },
    timeout: { type: Number, required: true },
});

export const Module = model<IModule>('Module', schema);
