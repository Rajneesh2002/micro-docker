const amqp = require('amqplib/callback_api');

let channel = null;

const connectRabbitMQ = () => {
    amqp.connect('amqp://localhost', (error0, connection) => {
        if (error0) throw error0;

        connection.createChannel((error1, ch) => {
            if (error1) throw error1;
            channel = ch;
            console.log('Order service connected to RabbitMQ');
        });
    });
};

// Emit event to RabbitMQ
const emitEvent = (queue, message) => {
    channel.assertQueue(queue, { durable: false });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    console.log(`Event sent to queue: ${queue}`);
};

module.exports = { connectRabbitMQ, emitEvent };
