import axios from 'axios';

export let KNOWN_BOT_LIST: Set<string>;

export async function fetchBots(): Promise<Set<string>> {
    const bots = (await axios.get(`https://api.github.com/gists/68ec520b109c7f93d55c6cab4ffc7659`)).data.files['bots.txt'].content;
    KNOWN_BOT_LIST = new Set(bots.toString().split('\n'));
    return KNOWN_BOT_LIST;
}

export function setBots(bots: Set<string>): void {
    KNOWN_BOT_LIST = bots;
}
