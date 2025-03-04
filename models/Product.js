import { readFile, writeFile } from '../utils/fileManager.js';

const FILE_PATH = '../productos.json';

export default class Product {
    static async getAll() {
        return await readFile(FILE_PATH);
    }

    static async getById(id) {
        const products = await readFile(FILE_PATH);
        return products.find(p => p.id === id);
    }

    static async add(productData) {
        const products = await readFile(FILE_PATH);
        const newProduct = { id: Date.now().toString(), ...productData }; // Generar ID único
        products.push(newProduct);
        await writeFile(FILE_PATH, products);
        return newProduct;
    }

    static async update(id, updatedData) {
        let products = await readFile(FILE_PATH);
        products = products.map(p => (p.id === id ? { ...p, ...updatedData } : p));
        await writeFile(FILE_PATH, products);
    }

    static async delete(id) {
        let products = await readFile(FILE_PATH);
        products = products.filter(p => p.id !== id);
        await writeFile(FILE_PATH, products);
    }
}
