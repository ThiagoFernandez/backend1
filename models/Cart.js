import { readFile, writeFile } from '../utils/fileManager.js';

const FILE_PATH = '../carrito.json';

export default class Cart {
    static async getById(cartId) {
        const carts = await readFile(FILE_PATH);
        return carts.find(c => c.id === cartId);
    }

    static async create() {
        const carts = await readFile(FILE_PATH);
        const newCart = { id: Date.now().toString(), products: [] };
        carts.push(newCart);
        await writeFile(FILE_PATH, carts);
        return newCart;
    }

    static async addProduct(cartId, productId) {
        const carts = await readFile(FILE_PATH);
        const cart = carts.find(c => c.id === cartId);

        if (!cart) return null;

        const productIndex = cart.products.findIndex(p => p.product === productId);
        if (productIndex !== -1) {
            cart.products[productIndex].quantity += 1;
        } else {
            cart.products.push({ product: productId, quantity: 1 });
        }

        await writeFile(FILE_PATH, carts);
        return cart;
    }

    static async delete(cartId) {
        let carts = await readFile(FILE_PATH);
        carts = carts.filter(c => c.id !== cartId);
        await writeFile(FILE_PATH, carts);
    }
}
