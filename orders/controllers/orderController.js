const Order = require('../models/Ordeer');
const axios = require('axios');
const { emitEvent } = require('../rabbitmq');

// Controller function to create an order
const createOrder = async (req, res) => {
    const { productId, userId, quantity } = req.body;

    // Step 1: Validate request body
    if (!productId || !userId || !quantity) {
        return res.status(400).json({ error: 'Product ID, User ID, and Quantity are required' });
    }

    try {
        // Step 2: Fetch product details from Product Service
        let product;
        try {
            const productResponse = await axios.get(`http://localhost:3002/products/${productId}`);
            product = productResponse.data;
        } catch (axiosError) {
            console.error('Error fetching product:', axiosError.message);
            return res.status(500).json({ error: 'Failed to fetch product from Product Service' });
        }

        // Step 3: Check if the stock is sufficient
        if (!product || product.stock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Step 4: Create the order
        let savedOrder;
        try {
            const newOrder = new Order({ productId, userId, quantity });
            savedOrder = await newOrder.save();
        } catch (dbError) {
            console.error('Error saving order:', dbError.message);
            return res.status(500).json({ error: 'Failed to create order' });
        }

        // Step 5: Emit "Order Created" event to RabbitMQ
        const eventPayload = {
            event: 'OrderCreated',
            data: {
                productId,
                quantity,
            },
        };
        try {
            emitEvent('orderQueue', eventPayload);
            console.log(`Event emitted to queue: productId = ${productId}, quantity = ${quantity}`);
        } catch (rabbitError) {
            console.error('Error emitting event to RabbitMQ:', rabbitError.message);
        }

        // Step 6: Return the created order
        res.status(201).json(savedOrder);
    } catch (error) {
        console.error('Unexpected error in createOrder:', error.message);
        res.status(500).json({ error: 'Unexpected error occurred' });
    }
};

// Controller function to get all orders
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find(); // Fetch all orders from the database
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        res.status(500).json({ error: 'Failed to retrieve orders' });
    }
};

module.exports = { createOrder, getAllOrders };