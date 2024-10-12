const express = require('express');
const router = express.Router();
const {createOrder, getAllOrders} = require('../controllers/orderController'); // Ensure this path is correct

// Route to create an order
router.post('/create', createOrder);

// Route to get all orders
router.get('/', getAllOrders); // Ensure this function exists in the controller

module.exports = router;
