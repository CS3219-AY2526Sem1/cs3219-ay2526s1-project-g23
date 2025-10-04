import User from '../models/User.js';

const userController = {
  getUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const requestingUser = req.user; // From auth middleware
      
      // Authorization check
      if (!requestingUser.isAdmin && requestingUser._id.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You can only access your own profile' 
        });
      }

      const user = await User.findById(userId).select('-password -passwordResetToken -passwordResetExpires');
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'The requested user does not exist' 
        });
      }

      res.status(200).json({ user });

    } catch (err) {
      console.error('Get user error:', err);
      res.status(500).json({ 
        error: 'Failed to retrieve user',
        message: 'Unable to fetch user information' 
      });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      // Admin check handled by roleMiddleware, but double-check here
      if (!req.user.isAdmin) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Administrator privileges required' 
        });
      }

      const { page = 1, limit = 10, search } = req.query;
      const query = search ? { 
        $or: [
          { username: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ]
      } : {};

      const users = await User.find(query)
        .select('-password -passwordResetToken -passwordResetExpires')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      res.status(200).json({ 
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (err) {
      console.error('Get all users error:', err);
      res.status(500).json({ 
        error: 'Failed to retrieve users',
        message: 'Unable to fetch users list' 
      });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const requestingUser = req.user;
      const updates = req.body;

      // Authorization check
      if (!requestingUser.isAdmin && requestingUser._id.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You can only update your own profile' 
        });
      }

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updates.password; // Use separate password change endpoint
      delete updates.isAdmin; // Use separate privilege endpoint
      delete updates._id;
      delete updates.createdAt;
      delete updates.updatedAt;

      const user = await User.findByIdAndUpdate(
        userId, 
        { $set: updates }, 
        { 
          new: true, 
          runValidators: true,
          context: 'query'
        }
      ).select('-password -passwordResetToken -passwordResetExpires');

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'The user to update does not exist' 
        });
      }

      res.status(200).json({ 
        message: 'Profile updated successfully',
        user 
      });

    } catch (err) {
      console.error('Update user error:', err);
      
      if (err.code === 11000) {
        return res.status(409).json({ 
          error: 'Duplicate field',
          message: 'Username or email already exists' 
        });
      }
      
      if (err.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: err.message 
        });
      }

      res.status(500).json({ 
        error: 'Update failed',
        message: 'Unable to update profile' 
      });
    }
  },

  updateUserPrivilege: async (req, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin } = req.body;
      
      // Admin check
      if (!req.user.isAdmin) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Administrator privileges required' 
        });
      }

      // Prevent self-privilege modification
      if (req.user._id.toString() === userId) {
        return res.status(400).json({ 
          error: 'Invalid operation',
          message: 'Cannot modify your own admin privileges' 
        });
      }

      const user = await User.findByIdAndUpdate(
        userId, 
        { isAdmin }, 
        { new: true, runValidators: true }
      ).select('-password -passwordResetToken -passwordResetExpires');

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'The user to update does not exist' 
        });
      }

      res.status(200).json({ 
        message: `User ${isAdmin ? 'promoted to' : 'demoted from'} administrator`,
        user 
      });

    } catch (err) {
      console.error('Update privilege error:', err);
      res.status(500).json({ 
        error: 'Privilege update failed',
        message: 'Unable to update user privileges' 
      });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const requestingUser = req.user;

      // Authorization check
      if (!requestingUser.isAdmin && requestingUser.userId !== userId) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You can only delete your own account' 
        });
      }

      // Prevent admin self-deletion
      if (requestingUser.isAdmin && requestingUser._id.toString() === userId) {
        return res.status(400).json({ 
          error: 'Invalid operation',
          message: 'Administrators cannot delete their own account' 
        });
      }

      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'The user to delete does not exist' 
        });
      }

      res.status(200).json({ 
        message: 'Account deleted successfully' 
      });

    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ 
        error: 'Deletion failed',
        message: 'Unable to delete account' 
      });
    }
  },

  // Enhanced logout with optional token blacklisting
  logout: async (req, res) => {
    try {
      // Optional: Add token to blacklist (requires Redis or similar)
      // const token = req.token;
      // await blacklistToken(token);
      
      res.status(200).json({ 
        message: 'Logged out successfully. Please clear your local token.' 
      });
    } catch (err) {
      console.error('Logout error:', err);
      res.status(500).json({ 
        error: 'Logout failed',
        message: 'Unable to process logout request' 
      });
    }
  },

  // Additional PeerPrep-specific methods
  updatePreferences: async (req, res) => {
    try {
      const { userId } = req.params;
      const { difficulty, topics, programmingLanguages } = req.body;

      // Only allow self-updates for preferences
      if (req.user._id.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You can only update your own preferences' 
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            'preferences.difficulty': difficulty,
            'preferences.topics': topics,
            'preferences.programmingLanguages': programmingLanguages 
          }
        },
        { new: true, runValidators: true }
      ).select('preferences');

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'Unable to update preferences' 
        });
      }

      res.status(200).json({ 
        message: 'Preferences updated successfully',
        preferences: user.preferences 
      });

    } catch (err) {
      console.error('Update preferences error:', err);
      res.status(500).json({ 
        error: 'Preferences update failed',
        message: 'Unable to update preferences' 
      });
    }
  }
};

export default userController;
