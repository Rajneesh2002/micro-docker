const Product = require('../models/Product'); // Ensure this path is correct
const { emitEvent } = require('../rabbitmq');  // Ensure this path is correct

// Controller function to create a product
const createProduct = async (req, res) => {
    const { name, price, inventory } = req.body;

    if (!name || !price || !inventory) {
        return res.status(400).json({ error: 'Name, price, and stock are required' });
    }

    try {
        const newProduct = new Product({ name, price, inventory });
        const savedProduct = await newProduct.save();

        // Emit event to RabbitMQ
        const eventPayload = {
            event: 'ProductCreated',
            data: savedProduct,
        };
        emitEvent('productQueue', eventPayload);

        res.status(201).json(savedProduct);
        
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
};

// Controller function to get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find(); // Fetch all products from the database
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).json({ error: 'Failed to retrieve products' });
    }
};

// Controller function to get a product by ID
const getProductById = async (req, res) => {
    const { id } = req.params;  // Extract the product ID from the request parameters

    try {
        const product = await Product.findById(id); // Find the product by its ID

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json(product); // Return the found product
    } catch (error) {
        console.error('Error fetching product:', error.message);
        res.status(500).json({ error: 'Failed to retrieve product' });
    }
};

module.exports = { createProduct, getAllProducts, getProductById };