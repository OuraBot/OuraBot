import axios from 'axios';

export let KNOWN_BOT_LIST: Set<string>;

export async function fetchBots(): Promise<Set<string>> {
    const bots = (await axios.get(`https://raw.githubusercontent.com/LinoYeen/Namelists/main/namelist.txt`)).data;
    KNOWN_BOT_LIST = new Set(bots.toString().split('\n'));
    return KNOWN_BOT_LIST;
}

export function setBots(bots: Set<string>): void {
    KNOWN_BOT_LIST = bots;
}
