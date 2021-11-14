import { redis } from '..';

type TimedReminder = {
    reminder: string;
    user: string;
    timestamp: number;
    channel: string;
    now: number;
};

export async function getTimedReminders(): Promise<TimedReminder[]> {
    let redisData = await redis.get('ob:timedreminders');
    if (!redisData) return [];

    let reminders: TimedReminder[] = JSON.parse(redisData);
    return reminders;
}

export async function addTimedReminder(reminder: string, user: string, timestamp: number, channel: string): Promise<void> {
    let reminders = await getTimedReminders();
    reminders.push({ reminder, user, timestamp, channel, now: Date.now() });
    await redis.set('ob:timedreminders', JSON.stringify(reminders));
}

export async function removeReminder(reminder: string, user: string, timestamp: number, channel: string): Promise<void> {
    let reminders = await getTimedReminders();
    reminders = reminders.filter((r) => r.reminder !== reminder && r.user !== user && r.timestamp !== timestamp && r.channel !== channel);
    await redis.set('ob:timedreminders', JSON.stringify(reminders));
}
