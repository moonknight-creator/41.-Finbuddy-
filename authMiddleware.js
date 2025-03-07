const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: true, 
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        // Return specific error for expired tokens
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: true, 
            message: 'Token expired',
            code: 'TOKEN_EXPIRED'
          });
        }
        
        return res.status(401).json({ 
          error: true, 
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      
      // Attach user info to request
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = { authenticate };