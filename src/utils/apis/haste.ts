import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import FormData from 'form-data';
dotenv.config();

export async function upload(message: string): Promise<string> {
    // If mrauro.dev key provided, use that, if not just use zneix's public haste api
    if (process.env.MRAURO_DEV_KEY) {
        fs.writeFileSync('./tempupload.txt', message);

        const form = new FormData();
        form.append('attachment', fs.createReadStream('./tempupload.txt'));
        const response = await axios.post('https://mrauro.dev/', form, {
            headers: {
                ...form.getHeaders(),
                authorization: process.env.MRAURO_DEV_KEY,
            },
        });
        fs.unlinkSync('./tempupload.txt');
        return response.data.url;
    } else {
        let hasteRes = await axios.post('https://haste.zneix.eu/documents', message);
        return `https://haste.zneix.eu/raw/${hasteRes.data.key}`;
    }
}
