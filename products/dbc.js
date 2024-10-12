const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const orderRoutes = require('./routes/productRoutes');
const { connectRabbitMQ } = require('./rabbitmq');
require('dotenv').config(); 
// Connect to MongoDB
// connectRabbitMQ();
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected for product Service'))
    .catch((err) => console.error('MongoDB connection error:', err));
