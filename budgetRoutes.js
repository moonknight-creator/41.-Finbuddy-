const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { checkAuth } = require('../middleware/auth');

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finbuddy',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Use a middleware approach for the budget route
router.get('/budget', (req, res) => {
  // Special case for budget page - check if we have a valid token in any form
  const token = req.cookies.token || 
                req.headers.authorization?.split(' ')[1] || 
                req.query.token;
  
  // Always render the budget page, but with different auth states
  // This prevents redirect loops and allows client-side JS to handle auth
  if (!token) {
    // Render page with auth flag = false, client-side JS will handle this
    return res.render('budget', { 
      isAuthenticated: false,
      redirectUrl: '/login?redirect=' + encodeURIComponent('/budget')
    });
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // User is authenticated, serve the budget page with user data
    return res.render('budget', { 
      isAuthenticated: true,
      user: decoded
    });
  } catch (error) {
    console.error('Budget route token verification failed:', error.message);
    // Clear invalid token
    res.clearCookie('token');
    
    // Render page with auth flag = false, client-side JS will handle login redirect
    return res.render('budget', { 
      isAuthenticated: false,
      redirectUrl: '/login?redirect=' + encodeURIComponent('/budget')
    });
  }
});

// API endpoint for budget data
router.get('/api/budget', checkAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get budget data for the authenticated user
    const connection = await pool.getConnection();
    
    // Get all budgets for the user
    const [budgets] = await connection.execute(
      'SELECT * FROM budgets WHERE user_id = ?',
      [userId]
    );
    
    // Get transactions for the current month
    const [transactions] = await connection.execute(
      'SELECT * FROM transactions WHERE user_id = ? AND date >= DATE_FORMAT(NOW(), "%Y-%m-01")',
      [userId]
    );
    
    connection.release();
    
    return res.json({ 
      success: true, 
      data: {
        budgets,
        transactions
      }
    });
  } catch (error) {
    console.error('Error fetching budget data:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch budget data' });
  }
});

module.exports = router;
