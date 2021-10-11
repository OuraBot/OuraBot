import { ChatClient } from 'twitch-chat-client/lib';
import { spamClients } from '..';

let lastIndex = 0;
export function getClient(): ChatClient {
    const readyClients = spamClients.filter((client) => client.isConnected);
    return readyClients[lastIndex++ % readyClients.length];
}
