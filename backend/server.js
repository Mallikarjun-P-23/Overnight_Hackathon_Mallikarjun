const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const forumRoutes = require('./routes/forum');
const quizResultRoutes = require('./routes/quizResults');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection with retry logic
let dbConnected = false;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully');
    dbConnected = true;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Retry connection after 3 seconds
    setTimeout(connectDB, 3000);
  }
};

connectDB();

// Middleware to check DB connection
app.use((req, res, next) => {
  if (!dbConnected && req.path !== '/api/health') {
    console.warn('Database not yet connected, but continuing...');
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/quiz-results', quizResultRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Backend is running',
    databaseConnected: dbConnected,
    mongodb: process.env.MONGODB_URI
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
});
