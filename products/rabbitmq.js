const amqp = require('amqplib/callback_api');

let channel = null;

// Connect to RabbitMQ
const connectRabbitMQ = () => {
    amqp.connect('amqp://localhost', (error0, connection) => {
        if (error0) throw error0;

        connection.createChannel((error1, ch) => {
            if (error1) throw error1;
            channel = ch;
            console.log('Connected to RabbitMQ');

            // Consume the orderQueue for "OrderCreated" events
            channel.assertQueue('PRODUCT', { durable: false });
            
            channel.consume('ORDER', async (msg) => {
                const event = JSON.parse(msg.content.toString());

                if (event.event === 'OrderCreated') {
                    const { productId, quantity } = event.data;

                    // Update product stock
                    const product = await Product.findById(productId);
                    if (product) {
                        product.stock -= quantity; // Decrease the stock
                        await product.save();       // Save updated product
                        console.log(`Stock updated for product: ${productId}, New Stock: ${product.stock}`);
                    } else {
                        console.log(`Product not found: ${productId}`);
                    }
                }
            }, { noAck: true });
        });
    });
};

// Emit event to RabbitMQ
const emitEvent = (queue, message) => {
    if (!channel) {
        console.error('RabbitMQ channel not initialized');
        return;
    }

    channel.assertQueue(queue, { durable: false });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    console.log(`Event sent to queue: ${queue}`);
};

// Export the functions
module.exports = { connectRabbitMQ, emitEvent };
