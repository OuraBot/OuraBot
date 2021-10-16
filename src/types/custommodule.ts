import { ChatClient } from '@twurple/chat';
import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import { promises as fs } from 'fs-extra';
import { Redis } from 'ioredis';

export class CustomModule {
    name: string;
    description: string;
    channels: string[];
    enabled?: boolean;
    author: string[];
    execute: (channel: string, user: string, message: string, msg: TwitchPrivateMessage, chatClient: ChatClient, redis: Redis) => Promise<void>;
}

export async function getModules(): Promise<Map<string, CustomModule>> {
    return new Map(
        (await fs.readdir('src/custommodules'))
            .map((file) => file.replace(/\.ts$/, ''))
            .map((custommodule: string): [string, CustomModule] => {
                console.log(`Loading custom module ${custommodule}`);
                delete require.cache[require.resolve(`../custommodules/${custommodule}`)];
                const module = require(`../custommodules/${custommodule}`);
                console.log(`Loaded custom module ${custommodule}`, module);
                return [module.module.name, module.module];
            })
    );
}
