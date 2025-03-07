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

// Learn page route
router.get('/learn', checkAuth, async (req, res) => {
  try {
    // Get all available courses
    const connection = await pool.getConnection();
    const [courses] = await connection.execute('SELECT * FROM courses');
    
    // Get user's learning progress if authenticated
    let progress = [];
    if (req.user && req.user.id) {
      [progress] = await connection.execute(
        'SELECT * FROM learning_progress WHERE user_id = ?',
        [req.user.id]
      );
    }
    
    // Get all badges
    const [badges] = await connection.execute('SELECT * FROM badges');
    
    // Get user's earned badges if authenticated
    let earnedBadges = [];
    if (req.user && req.user.id) {
      [earnedBadges] = await connection.execute(
        `SELECT b.* FROM badges b 
        JOIN user_badges ub ON b.id = ub.badge_id 
        WHERE ub.user_id = ?`,
        [req.user.id]
      );
    }
    
    connection.release();
    
    // Combine course data with progress info
    const coursesWithProgress = courses.map(course => {
      const userProgress = progress.find(p => p.course_id === course.id);
      return {
        ...course,
        progress: userProgress ? userProgress.progress : 0,
        completed: userProgress ? userProgress.completed : false
      };
    });
    
    // Render the learn page with data
    res.render('learn', {
      isAuthenticated: !!req.user,
      user: req.user,
      courses: coursesWithProgress,
      badges: badges,
      earnedBadges: earnedBadges
    });
  } catch (error) {
    console.error('Learn page error:', error);
    res.status(500).render('error', { message: 'Failed to load learning content' });
  }
});

// Course details route
router.get('/learn/course/:id', checkAuth, async (req, res) => {
  try {
    const courseId = req.params.id;
    const connection = await pool.getConnection();
    
    // Get course details
    const [courses] = await connection.execute(
      'SELECT * FROM courses WHERE id = ?',
      [courseId]
    );
    
    if (courses.length === 0) {
      connection.release();
      return res.status(404).render('error', { message: 'Course not found' });
    }
    
    const course = courses[0];
    
    // Get user progress if authenticated
    let userProgress = { progress: 0, completed: false };
    if (req.user && req.user.id) {
      const [progress] = await connection.execute(
        'SELECT * FROM learning_progress WHERE user_id = ? AND course_id = ?',
        [req.user.id, courseId]
      );
      
      if (progress.length > 0) {
        userProgress = progress[0];
      }
    }
    
    connection.release();
    
    // Render course details page
    res.render('course', {
      isAuthenticated: !!req.user,
      user: req.user,
      course: course,
      progress: userProgress
    });
  } catch (error) {
    console.error('Course details error:', error);
    res.status(500).render('error', { message: 'Failed to load course details' });
  }
});

// Update course progress API endpoint
router.post('/api/learn/progress', checkAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const { courseId, progress, completed } = req.body;
    
    if (!courseId || progress === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const connection = await pool.getConnection();
    
    // Check if course exists
    const [courses] = await connection.execute(
      'SELECT id FROM courses WHERE id = ?',
      [courseId]
    );
    
    if (courses.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Check if progress record exists
    const [existingProgress] = await connection.execute(
      'SELECT id FROM learning_progress WHERE user_id = ? AND course_id = ?',
      [req.user.id, courseId]
    );
    
    // Update or insert progress
    if (existingProgress.length > 0) {
      await connection.execute(
        'UPDATE learning_progress SET progress = ?, completed = ? WHERE user_id = ? AND course_id = ?',
        [progress, completed ? 1 : 0, req.user.id, courseId]
      );
    } else {
      await connection.execute(
        'INSERT INTO learning_progress (user_id, course_id, progress, completed) VALUES (?, ?, ?, ?)',
        [req.user.id, courseId, progress, completed ? 1 : 0]
      );
    }
    
    // Check for badge achievements
    if (completed) {
      // Award badges based on completion
      await checkAndAwardBadges(connection, req.user.id);
    }
    
    connection.release();
    
    return res.json({ success: true, message: 'Progress updated' });
  } catch (error) {
    console.error('Update progress error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update progress' });
  }
});

// Helper function to check and award badges
async function checkAndAwardBadges(connection, userId) {
  try {
    // Check how many courses the user has completed
    const [completedCourses] = await connection.execute(
      'SELECT COUNT(*) as count FROM learning_progress WHERE user_id = ? AND completed = 1',
      [userId]
    );
    
    const completedCount = completedCourses[0].count;
    
    // Award "Money Master" badge if all intro courses completed (4 or more)
    if (completedCount >= 4) {
      const [masterBadge] = await connection.execute(
        'SELECT id FROM badges WHERE name = "Money Master"'
      );
      
      if (masterBadge.length > 0) {
        const badgeId = masterBadge[0].id;
        
        // Check if user already has this badge
        const [existing] = await connection.execute(
          'SELECT 1 FROM user_badges WHERE user_id = ? AND badge_id = ?',
          [userId, badgeId]
        );
        
        if (existing.length === 0) {
          // Award the badge
          await connection.execute(
            'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
            [userId, badgeId]
          );
        }
      }
    }
  } catch (error) {
    console.error('Error awarding badges:', error);
  }
}

module.exports = router;
