import { redis } from '..';

type Afk = {
    user: string;
    status: Status;
    message: string;
    time: number;
};

export enum Status {
    SLEEP = 'SLEEPING',
    LURK = 'LURKING',
    AFK = 'AFK',
    EATING = 'EATING',
}

export async function getUserAfk(user: string): Promise<Afk> {
    let redisData: string = await redis.get(`ob:afks`);
    let afks: Afk[] = [];
    if (redisData) {
        afks = JSON.parse(redisData);
    } else {
        return null;
    }

    if (afks.length === 0) {
        return null;
    }

    if (afks.map((a) => a.user).includes(user)) {
        return afks.find((a) => a.user === user);
    } else {
        return null;
    }
}

export async function clearUserAfk(user: string) {
    let redisData: string = await redis.get(`ob:afks`);
    let afks: Afk[] = [];
    if (redisData) {
        afks = JSON.parse(redisData);
    } else {
        return false;
    }

    if (afks.length === 0) {
        return false;
    }

    if (afks.map((a) => a.user).includes(user)) {
        const cleanedAfks = afks.filter((a) => a.user !== user);
        await redis.set(`ob:afks`, JSON.stringify(cleanedAfks));
        return true;
    } else {
        return false;
    }
}

export async function setUserAfk(user: string, status: Status, message: string) {
    let redisData: string = await redis.get('ob:afks');
    let afks: Afk[] = [];
    if (!redisData) {
        afks = [];
    } else {
        afks = JSON.parse(redisData);
    }

    user = user.toLowerCase();

    const afk: Afk = {
        user,
        status,
        message,
        time: Date.now(),
    };

    afks.push(afk);

    await redis.set('ob:afks', JSON.stringify(afks));
}
