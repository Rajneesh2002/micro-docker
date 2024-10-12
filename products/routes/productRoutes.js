const express = require('express');
const router = express.Router();
const {createProduct, getAllProducts, getProductById} = require('../controllers/productController'); // Ensure this path is correct

// Route to create a product
router.post('/create', createProduct);

// Route to get all products
router.get('/', getAllProducts);  // Ensure this function is defined in the controller

// Route to get a product by ID
router.get('/:id', getProductById);  // New route to fetch a product by its ID

module.exports = router;
