import { connection, model, Schema } from 'mongoose';

delete connection.models['Sub'];

export interface ISub extends Schema {
    onSub_primeNew: string;
    onSub_tierOneNew: string;
    onSub_tierTwoNew: string;
    onSub_tierThreeNew: string;

    onResub_prime: string;
    onResub_primeStreak: string;
    onResub_one: string;
    onResub_oneStreak: string;
    onResub_two: string;
    onResub_twoStreak: string;
    onResub_three: string;
    onResub_threeStreak: string;

    giftPaidUpgrade_gifted: string;
    giftPaidUpgrade_anon: string;

    onPrimePaidUpgrade: string;

    onSubExtend: string;

    onSubGift_gifted: string;
    onSubGift_anon: string;

    onStandardPayForward_gifted: string;
    onStandardPayForward_anon: string;

    channel: string;
}

const schema = new Schema<ISub>(
    {
        onSub_primeNew: {
            type: String,
            required: true,
        },
        onSub_tierOneNew: {
            type: String,
            required: true,
        },
        onSub_tierTwoNew: {
            type: String,
            required: true,
        },
        onSub_tierThreeNew: {
            type: String,
            required: true,
        },

        // -------------

        onResub_prime: {
            type: String,
            required: true,
        },
        onResub_primeStreak: {
            type: String,
            required: true,
        },
        onResub_one: {
            type: String,
            required: true,
        },
        onResub_oneStreak: {
            type: String,
            required: true,
        },
        onResub_two: {
            type: String,
            required: true,
        },
        onResub_twoStreak: {
            type: String,
            required: true,
        },
        onResub_three: {
            type: String,
            required: true,
        },
        onResub_threeStreak: {
            type: String,
            required: true,
        },

        // -------------

        giftPaidUpgrade_gifted: {
            type: String,
            required: true,
        },
        giftPaidUpgrade_anon: {
            type: String,
            required: true,
        },

        // -------------

        onPrimePaidUpgrade: {
            type: String,
            required: true,
        },

        // -------------

        onSubExtend: {
            type: String,
            required: true,
        },

        // -------------

        onSubGift_gifted: {
            type: String,
            required: true,
        },
        onSubGift_anon: {
            type: String,
            required: true,
        },

        // -------------

        onStandardPayForward_gifted: {
            type: String,
            required: true,
        },
        onStandardPayForward_anon: {
            type: String,
            required: true,
        },

        // -------------

        // -------------

        channel: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Sub = model<ISub>('Sub', schema);
