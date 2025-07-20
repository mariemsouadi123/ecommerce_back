const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');

// Route imports
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

const app = express();

// Configuration
const JWT_SECRET = 'your-strong-secret-key--@123!';
const TOKEN_EXPIRY = '7d';
const MONGODB_URL = 'mongodb://localhost:27017/Ecommerce';

// Middleware Setup
app.use(cors({
  origin: ['http://localhost:3000', 'http://10.0.2.2:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log(' Connected to MongoDB'))
.catch(err => {
  console.error(' MongoDB connection error:', err.message);
  process.exit(1);
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Debug Endpoint
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await User.find({}).select('+password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth Endpoints
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Create and save user
    const user = new User({
      name: name?.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(), // Will be hashed by pre-save hook
      address: address?.trim(),
      phone: phone?.trim()
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );

    // Return response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ token, user: userResponse });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user with password explicitly included
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') }
    }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare passwords using model method
    const isMatch = await user.comparePassword(password.trim());
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );

    // Return response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ token, user: userResponse });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Protected Route
app.get('/api/user', authenticate, (req, res) => {
  res.json(req.user);
});
// Add this after your regular login endpoint
app.post('/api/google-login', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find or create user
    let user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') }
    });

    if (!user) {
      // Create new user for Google login
      user = new User({
        name: name?.trim() || 'Google User',
        email: email.trim().toLowerCase(),
        password: 'google_auth_password', // Special password for Google users
        address: 'Not provided',
        phone: 'Not provided'
      });
      await user.save();
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );

    // Return response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ token, user: userResponse });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google login failed' });
  }
});
// Auth Middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Test Endpoint
app.get('/api/ping', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Error Handlers
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on:`);
  console.log(`- http://localhost:${PORT}`);
  console.log(`- http://10.0.2.2:${PORT}`);
  console.log(`\n🔌 Available endpoints:`);
  console.log(`POST /api/register`);
  console.log(`POST /api/login`);
  console.log(`GET  /api/user (protected)`);
  console.log(`GET  /api/debug/users (debug)`);
  console.log(`GET  /api/ping (test)`);
});