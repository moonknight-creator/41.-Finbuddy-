const express = require('express');
const router = express.Router();
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

// Dashboard page route
router.get('/dashboard', checkAuth, async (req, res) => {
  try {
    // User is authenticated from checkAuth middleware
    return res.render('dashboard', {
      isAuthenticated: true,
      user: req.user
    });
  } catch (error) {
    console.error('Dashboard route error:', error);
    return res.redirect('/login');
  }
});

// Get financial overview API endpoint
router.get('/api/dashboard/overview', checkAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const connection = await pool.getConnection();
    
    // Get user profile with balance info
    const [profiles] = await connection.execute(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );
    
    // Get recent transactions
    const [transactions] = await connection.execute(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 5',
      [userId]
    );
    
    // Get budget summary
    const [budgetSummary] = await connection.execute(
      `SELECT 
        SUM(budget_limit) as total_budget, 
        SUM(spent) as total_spent 
      FROM budgets 
      WHERE user_id = ? AND period_start <= CURDATE() 
        AND DATE_ADD(period_start, INTERVAL 30 DAY) >= CURDATE()`,
      [userId]
    );
    
    // Get savings goals
    const [savingsGoals] = await connection.execute(
      'SELECT * FROM savings_goals WHERE user_id = ?',
      [userId]
    );
    
    // Calculate spending by category
    const [spendingByCategory] = await connection.execute(
      `SELECT 
        category, 
        SUM(amount) as total 
      FROM transactions 
      WHERE user_id = ? AND type = 'expense' 
        AND MONTH(date) = MONTH(CURRENT_DATE()) 
        AND YEAR(date) = YEAR(CURRENT_DATE())
      GROUP BY category`,
      [userId]
    );
    
    connection.release();
    
    // Create a financial snapshot
    const overview = {
      profile: profiles[0] || { balance: 0, income: 0, expenses: 0 },
      recentTransactions: transactions,
      budgetSummary: budgetSummary[0] || { total_budget: 0, total_spent: 0 },
      savingsGoals: savingsGoals,
      spendingByCategory: spendingByCategory
    };
    
    return res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Financial overview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch financial overview'
    });
  }
});

// Add new transaction API endpoint
router.post('/api/dashboard/transactions', checkAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type, amount, category, date } = req.body;
    
    // Validate inputs
    if (!name || !type || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const connection = await pool.getConnection();
    
    // Add transaction
    const [result] = await connection.execute(
      'INSERT INTO transactions (user_id, name, type, amount, category, date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, type, amount, category, date || new Date()]
    );
    
    // Update profile balance
    if (type === 'income') {
      await connection.execute(
        'UPDATE profiles SET balance = balance + ?, income = income + ? WHERE user_id = ?',
        [amount, amount, userId]
      );
    } else {
      // If it's an expense, also update budget spent
      await connection.execute(
        'UPDATE profiles SET balance = balance - ?, expenses = expenses + ? WHERE user_id = ?',
        [amount, amount, userId]
      );
      
      // Update budget category spent amount
      await connection.execute(
        `UPDATE budgets 
         SET spent = spent + ? 
         WHERE user_id = ? AND category = ? 
         AND period_start <= CURDATE() 
         AND DATE_ADD(period_start, INTERVAL 30 DAY) >= CURDATE()`,
        [amount, userId, category]
      );
    }
    
    connection.release();
    
    return res.json({
      success: true,
      message: 'Transaction added successfully',
      transactionId: result.insertId
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add transaction'
    });
  }
});

// Add or update budget API endpoint
router.post('/api/dashboard/budgets', checkAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, budget_limit, period_start } = req.body;
    
    // Validate inputs
    if (!category || !budget_limit) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const connection = await pool.getConnection();
    
    // Check if budget exists for this category and period
    const [existingBudget] = await connection.execute(
      `SELECT id FROM budgets 
       WHERE user_id = ? AND category = ? 
       AND period_start = ?`,
      [userId, category, period_start || new Date().toISOString().slice(0, 10)]
    );
    
    // Insert or update budget
    if (existingBudget.length === 0) {
      await connection.execute(
        'INSERT INTO budgets (user_id, category, budget_limit, period_start) VALUES (?, ?, ?, ?)',
        [userId, category, budget_limit, period_start || new Date().toISOString().slice(0, 10)]
      );
    } else {
      await connection.execute(
        'UPDATE budgets SET budget_limit = ? WHERE id = ?',
        [budget_limit, existingBudget[0].id]
      );
    }
    
    connection.release();
    
    return res.json({
      success: true,
      message: 'Budget updated successfully'
    });
  } catch (error) {
    console.error('Update budget error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update budget'
    });
  }
});

// Add or update savings goal API endpoint
router.post('/api/dashboard/savings', checkAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, name, target, saved, icon } = req.body;
    
    // Validate inputs
    if (!name || !target) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const connection = await pool.getConnection();
    
    if (id) {
      // Update existing savings goal
      await connection.execute(
        'UPDATE savings_goals SET name = ?, target = ?, saved = ?, icon = ? WHERE id = ? AND user_id = ?',
        [name, target, saved || 0, icon, id, userId]
      );
    } else {
      // Create new savings goal
      await connection.execute(
        'INSERT INTO savings_goals (user_id, name, target, saved, icon) VALUES (?, ?, ?, ?, ?)',
        [userId, name, target, saved || 0, icon]
      );
    }
    
    connection.release();
    
    return res.json({
      success: true,
      message: 'Savings goal updated successfully'
    });
  } catch (error) {
    console.error('Update savings goal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update savings goal'
    });
  }
});

module.exports = router;
