import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import Product from './models/Product.js';
import Cart from './models/Cart.js';

const app = express();
const PORT = 8080;

app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/ecommerce', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const productsRouter = express.Router();

productsRouter.get('/', async (req, res) => {
    const { limit = 10, page = 1, sort, query } = req.query;
    
    let filter = {};
    if (query) {
        if (query === 'available') {
            filter.stock = { $gt: 0 };
        } else {
            filter.category = query;
        }
    }

    const options = {
        limit: parseInt(limit),
        page: parseInt(page),
        sort: sort ? { price: sort === 'asc' ? 1 : -1 } : {}
    };

    try {
        const result = await Product.paginate(filter, options);
        res.json({
            status: 'success',
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.hasPrevPage ? result.page - 1 : null,
            nextPage: result.hasNextPage ? result.page + 1 : null,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

productsRouter.get('/:pid', async (req, res) => {
    try {
        const product = await Product.findById(req.params.pid);
        res.json(product || { error: 'Producto no encontrado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});


productsRouter.post('/', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar producto' });
    }
});


productsRouter.put('/:pid', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.pid, req.body, { new: true });
        res.json(updatedProduct || { error: 'Producto no encontrado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});


productsRouter.delete('/:pid', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.pid);
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});


const cartsRouter = express.Router();

cartsRouter.post('/', async (req, res) => {
    try {
        const newCart = new Cart({ products: [] });
        await newCart.save();
        res.status(201).json(newCart);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear carrito' });
    }
});

cartsRouter.get('/:cid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid).populate('products.product');
        res.json(cart || { error: 'Carrito no encontrado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el carrito' });
    }
});


cartsRouter.post('/:cid/products/:pid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

        const productIndex = cart.products.findIndex(p => p.product.toString() === req.params.pid);
        if (productIndex !== -1) {
            cart.products[productIndex].quantity += 1;
        } else {
            cart.products.push({ product: req.params.pid, quantity: 1 });
        }
        
        await cart.save();
        res.json({ status: 'success', message: 'Producto agregado al carrito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar producto al carrito' });
    }
});


cartsRouter.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

        cart.products = cart.products.filter(p => p.product.toString() !== req.params.pid);
        await cart.save();
        res.json({ status: 'success', message: 'Producto eliminado del carrito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar producto del carrito' });
    }
});


cartsRouter.delete('/:cid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

        cart.products = [];
        await cart.save();
        res.json({ status: 'success', message: 'Carrito vaciado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al vaciar el carrito' });
    }
});

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.get('/', (req, res) => {
    res.redirect('/api/products');
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
