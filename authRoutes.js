const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate } = require('../middleware/authMiddleware');

// Login route with improved token settings
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email }).catch(err => {
      console.error('Database error:', err);
      throw new Error('Database connection error');
    });

    if (!user) {
      return res.status(400).json({ 
        error: true, 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password).catch(err => {
      console.error('Password comparison error:', err);
      throw new Error('Authentication error');
    });

    if (!isMatch) {
      return res.status(400).json({ 
        error: true, 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Create token with longer expiration (7 days)
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Send user info and token
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: true, 
      message: error.message || 'Server error', 
      code: 'SERVER_ERROR' 
    });
  }
});

// Token refresh endpoint
router.post('/refresh-token', authenticate, async (req, res) => {
  try {
    // Verify user still exists in database
    const user = await User.findById(req.user.id).catch(err => {
      console.error('Database error:', err);
      throw new Error('Database connection error');
    });
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User account no longer exists',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Generate new token
    const newToken = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token: newToken,
      expiresIn: 7 * 24 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      error: true, 
      message: error.message || 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Check authentication status
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').catch(err => {
      console.error('Database error:', err);
      throw new Error('Database connection error');
    });
    
    if (!user) {
      return res.status(404).json({ 
        error: true, 
        message: 'User not found', 
        code: 'USER_NOT_FOUND' 
      });
    }
    
    res.json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ 
      error: true, 
      message: error.message || 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Name, email, and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        error: true,
        message: 'Password must be at least 6 characters',
        code: 'WEAK_PASSWORD'
      });
    }
    
    // Check if user already exists
    let user = await User.findOne({ email }).catch(err => {
      console.error('Database error:', err);
      throw new Error('Database connection error');
    });
    
    if (user) {
      return res.status(400).json({
        error: true,
        message: 'User already exists',
        code: 'USER_EXISTS'
      });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      password
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();
    
    // Create token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      expiresIn: 7 * 24 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Password reset request
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: true,
        message: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal that the user does not exist for security reasons
      return res.json({
        success: true,
        message: 'If your account exists, a password reset link has been sent to your email'
      });
    }
    
    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // In a real app, send an email with the reset link
    // For development, just return the token
    res.json({
      success: true,
      message: 'If your account exists, a password reset link has been sent to your email',
      // Only include the token in development environments
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      error: true,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Password reset with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        error: true,
        message: 'Token and new password are required',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: true,
        message: 'Password must be at least 6 characters',
        code: 'WEAK_PASSWORD'
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Check token purpose
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({
        error: true,
        message: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      error: true,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Logout endpoint - for token invalidation tracking on backend
router.post('/logout', authenticate, async (req, res) => {
  try {
    // In a more complex app, you might want to add the token to a blacklist
    // or store token expiry in a Redis cache
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: true,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Verify token validity
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: true,
        message: 'Token is required',
        code: 'MISSING_TOKEN'
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.json({
        success: true,
        valid: true,
        userId: decoded.id
      });
    } catch (error) {
      res.json({
        success: true,
        valid: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: true,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
