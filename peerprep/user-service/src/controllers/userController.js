import User from '../models/User.js';

const userController = {
  getUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const requester = req.user;
      const user = await User.findById(userId).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (requester.isAdmin || requester.userId === userId) {
        return res.status(200).json({ user });
      } else {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },
  getAllUsers: async (req, res) => {
    try {
      const requester = req.user;
      if (!requester.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const users = await User.find().select('-password');
      res.status(200).json({ users });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },
  updateUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const requester = req.user;
      const { username, email, password } = req.body;
      if (!username && !email && !password) {
        return res.status(400).json({ message: 'Missing fields' });
      }
      if (!requester.isAdmin && requester.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const update = {};
      if (username) update.username = username;
      if (email) update.email = email;
      if (password) {
        const bcrypt = await import('bcryptjs');
        update.password = await bcrypt.default.hash(password, 10);
      }
      const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'User updated', user });
    } catch (err) {
      if (err.code === 11000) {
        res.status(409).json({ message: 'Duplicate username or email' });
      } else {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    }
  },
  updateUserPrivilege: async (req, res) => {
    try {
      const { userId } = req.params;
      const requester = req.user;
      const { isAdmin } = req.body;
      if (typeof isAdmin !== 'boolean') {
        return res.status(400).json({ message: 'Missing fields' });
      }
      if (!requester.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const user = await User.findByIdAndUpdate(userId, { isAdmin }, { new: true }).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'User privilege updated', user });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },
  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const requester = req.user;
      if (!requester.isAdmin && requester.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const user = await User.findByIdAndDelete(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'User deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },
  logout: async (req, res) => {
    // For stateless JWT, logout is handled on client side by deleting token
    res.status(200).json({ message: 'Logged out' });
  }
};

export default userController;
