import express from 'express';
import fs from 'fs/promises';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 8080;
app.use(express.json());

const productsFile = path.join(__dirname, 'productos.json');
const cartsFile = path.join(__dirname, 'carrito.json');

const readFile = async (file) => {
    try {
        const data = await fs.readFile(file, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error leyendo ${file}:`, error);
        return [];
    }
};

const writeFile = async (file, data) => {
    try {
        await fs.writeFile(file, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error escribiendo ${file}:`, error);
    }
};

const getNextId = async (file) => {
    const data = await readFile(file);
    if (data.length === 0) return 1;
    return Math.max(...data.map(item => item.id)) + 1;
};

const productsRouter = express.Router();

productsRouter.get('/', async (req, res) => {
    const products = await readFile(productsFile);
    const limit = req.query.limit ? parseInt(req.query.limit) : products.length;
    res.json(products.slice(0, limit));
});

productsRouter.get('/:pid', async (req, res) => {
    const products = await readFile(productsFile);
    const product = products.find(p => p.id === parseInt(req.params.pid));
    res.json(product || { error: 'Producto no encontrado' });
});

productsRouter.post('/', async (req, res) => {
    const { title, description, code, price, stock, category, thumbnails } = req.body;

    if (!title || !description || !code || price === undefined || stock === undefined || !category) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios excepto thumbnails' });
    }

    if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: 'El precio debe ser un número mayor que 0' });
    }
    if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({ error: 'El stock debe ser un número positivo' });
    }

    if (thumbnails && (!Array.isArray(thumbnails) || !thumbnails.every(item => typeof item === 'string'))) {
        return res.status(400).json({ error: 'Thumbnails debe ser un array de cadenas de texto' });
    }

    const products = await readFile(productsFile);
    const newProduct = { 
        id: await getNextId(productsFile), 
        title, description, code, price, 
        status: true, stock, category, 
        thumbnails: thumbnails || [] 
    };
    products.push(newProduct);
    await writeFile(productsFile, products);
    res.json(newProduct);
});

productsRouter.put('/:pid', async (req, res) => {
    const products = await readFile(productsFile);
    const index = products.findIndex(p => p.id === parseInt(req.params.pid));
    if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });

    products[index] = { ...products[index], ...req.body, id: products[index].id };
    await writeFile(productsFile, products);
    res.json(products[index]);
});

productsRouter.delete('/:pid', async (req, res) => {
    const products = await readFile(productsFile);
    const filteredProducts = products.filter(p => p.id !== parseInt(req.params.pid));
    await writeFile(productsFile, filteredProducts);
    res.json({ message: 'Producto eliminado' });
});

const cartsRouter = express.Router();

cartsRouter.post('/', async (req, res) => {
    const carts = await readFile(cartsFile);
    const newCart = { id: await getNextId(cartsFile), products: [] };
    carts.push(newCart);
    await writeFile(cartsFile, carts);
    res.json(newCart);
});

cartsRouter.get('/:cid', async (req, res) => {
    const carts = await readFile(cartsFile);
    const cart = carts.find(c => c.id === parseInt(req.params.cid));
    res.json(cart || { error: 'Carrito no encontrado' });
});

cartsRouter.post('/:cid/product/:pid', async (req, res) => {
    const carts = await readFile(cartsFile);
    const products = await readFile(productsFile);
    const cart = carts.find(c => c.id === parseInt(req.params.cid));
    const product = products.find(p => p.id === parseInt(req.params.pid));

    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const productInCart = cart.products.find(p => p.product === product.id);
    if (productInCart) {
        productInCart.quantity++;
    } else {
        cart.products.push({ product: product.id, quantity: 1 });
    }

    await writeFile(cartsFile, carts);
    res.json(cart);
});

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
