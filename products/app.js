require('dotenv').config();  // Load environment variables
const amqp = require('amqplib/callback_api');
const mongoose = require('mongoose');
const express = require('express');
const productRoutes = require('./routes/productRoutes');
const { connectRabbitMQ } = require('./rabbitmq');
const Product = require('./models/Product');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected for Product Service'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Express app setup
const app = express();
app.use(express.json());
// app.use('/api/products', productRoutes);


let channel = null;
amqp.connect('amqp://localhost', (err, connection) => {
  if (err) throw err;
  connection.createChannel((err, ch) => {
    if (err) throw err;
    channel = ch;
    channel.assertQueue('product_events', { durable: false });

      // Listen for "Order Placed" events to update inventory
    channel?.consume('order_events', async (msg) => {

      console.log('Order placed event received');
      const event = JSON.parse(msg.content.toString());

      if (event.type === 'Order Placed') {

        console.log('Order placed event received');

        const productId = event.data.productId;
        const quantity = event.data.quantity;
        const product = await Product.findById(productId);

        if (product) {
          if(product.inventory>quantity) product.inventory-= quantity;
          else product.inventory=0;
          await product.save();
          console.log(`Inventory updated for product: ${productId}, New Inventory: ${product.inventory}`);
        }
      }
    }, { noAck: true });

  });
});

//get all products route
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
    console.log("Products fetched successfully")
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});
  

// Create a product
app.post('/products', async (req, res) => {
    const { name, price, inventory } = req.body;
    const product = new Product({ name, price, inventory });
    await product.save();
  
    // Emit event: Product Created
    const event = { type: 'Product Created', data: { productId: product._id, name } };
    channel.sendToQueue('product_events', Buffer.from(JSON.stringify(event)));
    const queue="product_events";
    console.log(`Event sent to queue: ${queue}`);
  
    res.json({ message: 'Product created successfully' });
    console.log("Product created successfully")
});
  
// Update inventory
app.put('/products/:id/inventory', async (req, res) => {
    const { inventory } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { inventory });
  
    // Emit event: Inventory Updated
    const event = { type: 'Inventory Updated', data: { productId: product._id, inventory } };
    channel.sendToQueue('product_events', Buffer.from(JSON.stringify(event)));
    const queue="product_events";
    console.log(`Event sent to queue: ${queue}`);
  
    res.json({ message: 'Inventory updated successfully' });
    console.log("Inventory updated successfully")
});


  












// Connect to RabbitMQ
// connectRabbitMQ();











const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Product service running on port ${PORT}`);
});
