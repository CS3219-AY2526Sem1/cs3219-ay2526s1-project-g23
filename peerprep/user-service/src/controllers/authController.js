import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const authController = {
  signup: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Missing fields' });
      }
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(409).json({ message: 'Username or email already exists' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, email, password: hashedPassword });
      await user.save();
      res.status(201).json({ message: 'User created successfully', user });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, username, password } = req.body;
      if ((!email && !username) || !password) {
        return res.status(400).json({ message: 'Missing fields' });
      }
      const user = await User.findOne(email ? { email } : { username });
      if (!user) {
        return res.status(401).json({ message: 'Incorrect email/username or password' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect email/username or password' });
      }
      const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.status(200).json({ message: 'Login successful', token, user });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email required' });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ message: 'Password reset token generated', resetToken });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Missing fields' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  verifyToken: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'Missing JWT' });
      }
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'Token verified', user });
    } catch (err) {
      res.status(401).json({ message: 'Invalid or expired JWT', error: err.message });
    }
  }
};

export default authController;
