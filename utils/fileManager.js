import fs from 'fs/promises';

export async function readFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return []; 
    }
}

export async function writeFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
