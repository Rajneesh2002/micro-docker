const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { emitEvent } = require('../rabbitmq');

const getAllUsers = async (req, res) => {
  try {
      const products = await User.find(); // Fetch all products from the database
      res.status(200).json(products);
  } catch (error) {
      console.error('Error fetching products:', error.message);
      res.status(500).json({ error: 'Failed to retrieve Users' });
  }
};

const registerUser = async (req, res) => {
  const newUser = new User(req.body);
  await newUser.save();

  // Emit "User Registered" event via RabbitMQ
  emitEvent('USER', { event: 'User Registered', data: newUser });

  res.status(201).send({ message: 'User Registered', user: newUser });
};

const loginUser = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user && user.password === req.body.password) {
    const token = jwt.sign({ userId: user._id }, 'secret', { expiresIn: '1h' });
    res.status(200).send({ token });
  } else {
    res.status(401).send({ message: 'Authentication failed' });
  }
};

module.exports = { registerUser, loginUser ,getAllUsers };
