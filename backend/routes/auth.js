const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Determine role from email domain.
    // Accepts variants like `user@principal`, `user@principal.com`, `user@principal.org`, etc.
    let role;
    if (/@principal(?:$|\.)/i.test(email)) {
      role = 'principal';
    } else if (/@teacher(?:$|\.)/i.test(email)) {
      role = 'teacher';
    } else if (/@student(?:$|\.)/i.test(email)) {
      role = 'student';
    } else {
      return res.status(400).json({ message: 'Invalid email domain. Use @principal, @teacher, or @student (e.g. user@principal.com)' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    // Create role-specific profile
    if (role === 'student') {
      try {
        await Student.create({ userId: user._id });
      } catch (studentError) {
        console.error('Error creating student profile:', studentError);
      }
    } else if (role === 'teacher') {
      try {
        await Teacher.create({ userId: user._id });
      } catch (teacherError) {
        console.error('Error creating teacher profile:', teacherError);
      }
    }

    res.status(201).json({ message: 'User registered successfully', role, userId: user._id });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

module.exports = router;
