import axios from 'axios';

export async function upload(message: string): Promise<string> {
    let hasteRes = await axios.post('https://haste.zneix.eu/documents', message);
    return `https://haste.zneix.eu/${hasteRes.data.key}`;
}
