import { redis } from '..';

export type Block = {
    user: string;
    blockedAll: boolean;
    commands: string[];
};

export async function canUseCommand(user: string, command: string): Promise<boolean> {
    const redisData = await redis.get(`ob:blockeddata:${user.toLowerCase()}`);
    let blockedData: Block = null;

    if (redisData) {
        blockedData = JSON.parse(redisData);

        if (blockedData.blockedAll) {
            return false;
        }

        if (blockedData.commands.includes(command)) {
            return false;
        } else {
            return true;
        }
    } else {
        return true;
    }
}
