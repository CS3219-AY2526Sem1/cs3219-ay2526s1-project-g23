import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid authorization header' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch current user from database to get latest data
    const user = await User.findById(decoded.userId).select('-password -passwordResetToken -passwordResetExpires');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user; // Attach full user object to request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
};

export default authMiddleware;
