const jwt = require("jsonwebtoken");
const User = require("../models/User");
const dotenv = require("dotenv");

dotenv.config({ path: ".././src/config/config.env" });

const isAuthenticated = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    console.log('Auth middleware - Received token:', token);
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    
    // Handle both "Bearer token" and raw token formats
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }
    
    console.log('Auth middleware - Processing token:', token);
    console.log('Auth middleware - JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token:', decoded);
    
    req.user = await User.findById(decoded._id);
    console.log('Auth middleware - Found user:', !!req.user);
    
    if (!req.user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: "invalid token" });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "token expired" });
    } else {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
};

module.exports = { isAuthenticated, isAdmin };
