import { model, models, Schema } from 'mongoose';
import type { IChannel } from 'Common';
import { ChannelSchema } from 'Common';

const Str = Schema.Types.String as any;
Str.checkRequired((v: string) => v != null);

export const ChannelModel = models['Channel'] || model<IChannel>('Channel', ChannelSchema);

export type { IChannel } from 'Common';
