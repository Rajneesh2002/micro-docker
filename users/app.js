require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const User = require('./models/User');
// const { connectRabbitMQ } = require('./rabbitmq');
const amqp = require('amqplib/callback_api');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
// Connect to MongoDB Atlas

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas connected for User Service'))
  .catch((err) => console.error('MongoDB connection error:', err));

const app = express();
app.use(bodyParser.json());

// app.use('/api/users', userRoutes);

// RabbitMQ connection
let channel = null;
amqp.connect('amqp://localhost', (err, connection) => {
  if (err) throw err;
  connection.createChannel((err, ch) => {
    if (err) throw err;
    channel = ch;
    channel.assertQueue('user_events', { durable: false });
  });
});


//get all users route
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
    console.log("Users fetched successfully")
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

//register user route
app.post('/api/users/register', async (req, res) => {

  const { name, email, password } = req.body;

try {
  const existingUser = await User.findOne({ $or: [{ name }, { email }] });
  if (existingUser) {
    throw new Error('User already exists'); // Clear error message
  }

  const salt = await bcrypt.genSalt(10); // Generate a strong salt
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = new User({ name, email, password: hashedPassword });

  await user.save();
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Use environment variable for secret key

  const event = { type: 'User Registered', data: { userId: user._id, email } };
  channel.sendToQueue('user_events', Buffer.from(JSON.stringify(event)));
  
  const queue="user_events";
  console.log(`Event sent to queue: ${queue}`);

  res.json({ token, message: 'User registered successfully' });
} catch (error) {
  console.error(error.message); // Log the error for debugging
  res.status(400).json({ message: 'Registration failed' }); // Send generic error response
}
});

//profile update route

// app.put('/profile', async (req, res) => {
//   const { userId, profile } = req.body;
//   const user = await User.findByIdAndUpdate(userId, { profile });

//   // Emit event: User Profile Updated
//   const event = { type: 'User Profile Updated', data: { userId } };
//   channel.sendToQueue('user_events', Buffer.from(JSON.stringify(event)));

//   res.json({ message: 'Profile updated successfully' });
// });



// Listen to other services' events (optional)
channel?.consume('order_events', (msg) => {
  const event = JSON.parse(msg.content.toString());
  console.log('Received event:', event);
}, { noAck: true });


app.listen(3001, () => {
  console.log('User service running on port 3001');
  // connectRabbitMQ();
});
