const amqp = require('amqplib/callback_api');

let channel = null;

// const connectRabbitMQ = () => {
//   amqp.connect('amqp://localhost', (error0, connection) => {
//     if (error0) throw error0;

//     connection.createChannel((error1, ch) => {
//       if (error1) throw error1;
//       channel = ch;
//       console.log('User service connected to RabbitMQ');
//       await channel.assertQueue("PRODUCT");
//     });
//   });
// };

async function connectRabbitMQ() {
  const amqpServer = "amqp://localhost:5672";
  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel();
  await channel.assertQueue("PRODUCT");
}

const emitEvent = (queue, message) => {
  channel.assertQueue(queue, { durable: false });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  console.log(`Event sent to queue: ${queue}`);
};

module.exports = { connectRabbitMQ, emitEvent };
