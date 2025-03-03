import express from 'express';
import mongoose from 'mongoose';
import Product from './models/Product.js';
import Cart from './models/Cart.js';

const MONGO_URI = "mongodb://localhost:27017/ecommerce"; // Cambia esto si usas otro puerto o un servicio en la nube

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("🔥 Conectado a MongoDB"))
  .catch(error => console.error("❌ Error conectando a MongoDB:", error));

const app = express();
const PORT = 8080;
app.use(express.json());

const productsRouter = express.Router();

// Obtener productos con paginación, filtros y ordenamiento
productsRouter.get('/', async (req, res) => {
    const { limit = 10, page = 1, sort, query } = req.query;
    
    let filter = {};
    if (query) {
        if (query === 'available') {
            filter.stock = { $gt: 0 }; // Filtrar productos con stock disponible
        } else {
            filter.category = query; // Filtrar por categoría específica
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
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `/api/products?limit=${limit}&page=${result.page - 1}` : null,
            nextLink: result.hasNextPage ? `/api/products?limit=${limit}&page=${result.page + 1}` : null
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

const cartsRouter = express.Router();

// Obtener carrito con productos poblados
cartsRouter.get('/:cid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid).populate('products.product');
        res.json(cart || { error: 'Carrito no encontrado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el carrito' });
    }
});

// Eliminar un producto del carrito
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

// Actualizar el carrito con un nuevo arreglo de productos
cartsRouter.put('/:cid', async (req, res) => {
    try {
        const cart = await Cart.findByIdAndUpdate(req.params.cid, { products: req.body.products }, { new: true });
        res.json(cart || { error: 'Carrito no encontrado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el carrito' });
    }
});

// Actualizar solo la cantidad de un producto en el carrito
cartsRouter.put('/:cid/products/:pid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

        const productIndex = cart.products.findIndex(p => p.product.toString() === req.params.pid);
        if (productIndex === -1) return res.status(404).json({ error: 'Producto no encontrado en el carrito' });

        cart.products[productIndex].quantity = req.body.quantity;
        await cart.save();
        res.json({ status: 'success', message: 'Cantidad actualizada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la cantidad del producto' });
    }
});

// Vaciar completamente un carrito
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

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
