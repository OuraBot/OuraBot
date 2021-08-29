import * as fs from 'fs';

interface botConfig {
    tmi: {
        channels: Array<string>;
    };
    owner: string;
    prefix: string;
    debugprefix: string;
}

export interface StreamData {
    title: string;
    date: string;
    time: string;
}

export function getConfig(): botConfig {
    return JSON.parse(fs.readFileSync('./src/config.json').toString());
}

/*
export function getAPITokens(): TokenConfig {
    return JSON.parse(fs.readFileSync('./src/TMItokens.json').toString());
}
export function getTMITokens(): TokenConfig {
    return JSON.parse(fs.readFileSync('./src/TMItokens.json').toString());
}
*/
