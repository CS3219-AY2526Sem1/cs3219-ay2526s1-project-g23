import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const authController = {
  signup: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Basic validation
      if (!username || !email || !password) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Username, email, and password are required' 
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { username: username.trim() }, 
          { email: email.toLowerCase().trim() }
        ] 
      });
      
      if (existingUser) {
        const field = existingUser.email === email.toLowerCase().trim() ? 'email' : 'username';
        return res.status(409).json({ 
          error: 'User already exists',
          message: `An account with this ${field} already exists`
        });
      }

      const user = new User({ 
        username: username.trim(), 
        email: email.toLowerCase().trim(), 
        password 
      });
      
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          isAdmin: user.isAdmin,
          email: user.email 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
      );

      // Return success without sensitive data
      res.status(201).json({ 
        message: 'Account created successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
          preferences: user.preferences,
          stats: user.stats,
          createdAt: user.createdAt
        }
      });

    } catch (err) {
      console.error('Signup error:', err);
      
      // Handle duplicate key errors
      if (err.code === 11000) {
        const field = err.message.includes('email') ? 'email' : 'username';
        return res.status(409).json({ 
          error: 'Duplicate field',
          message: `This ${field} is already registered` 
        });
      }
      
      // Handle validation errors
      if (err.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: Object.values(err.errors)[0].message
        });
      }
      
      res.status(500).json({ 
        error: 'Registration failed',
        message: 'Unable to create account. Please try again.' 
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, username, password } = req.body;
      
      // Validation
      if ((!email && !username) || !password) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Email or username and password are required' 
        });
      }

      // Find user by email or username
      const query = email ? 
        { email: email.toLowerCase().trim() } : 
        { username: username.trim() };
        
      const user = await User.findOne(query).select('+password +isActive');
      
      if (!user) {
        return res.status(401).json({ 
          error: 'Authentication failed',
          message: 'Invalid credentials' 
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({ 
          error: 'Account deactivated',
          message: 'Your account has been deactivated. Please contact support.' 
        });
      }

      // Use User model's comparePassword method
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          error: 'Authentication failed',
          message: 'Invalid credentials' 
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          isAdmin: user.isAdmin,
          email: user.email 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
      );

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.status(200).json({ 
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
          preferences: user.preferences,
          stats: user.stats,
          lastLogin: user.lastLogin
        }
      });

    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ 
        error: 'Login failed',
        message: 'Unable to process login. Please try again.' 
      });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          error: 'Missing required field',
          message: 'Email is required' 
        });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      
      if (!user) {
        return res.status(200).json({ 
          message: 'If an account with this email exists, a reset link has been sent.' 
        });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Store hashed token and expiration in database (10 minutes)
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      // TODO: Send email with resetToken (not hashedToken)
      // For development/testing, return the token
      // In production, remove this and send via email service
      res.status(200).json({ 
        message: 'Password reset instructions sent to your email',
        resetToken: resetToken // Only for testing - send via email instead
      });

    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ 
        error: 'Password reset failed',
        message: 'Unable to process password reset request' 
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Reset token and new password are required' 
        });
      }

      // Hash the provided token to match stored version
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ 
          error: 'Invalid or expired token',
          message: 'Password reset token is invalid or has expired. Please request a new one.' 
        });
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.passwordChangedAt = new Date();
      await user.save();

      res.status(200).json({ 
        message: 'Password reset successful. Please log in with your new password.' 
      });

    } catch (err) {
      console.error('Reset password error:', err);
      
      if (err.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Invalid password',
          message: Object.values(err.errors)[0].message
        });
      }
      
      res.status(500).json({ 
        error: 'Password reset failed',
        message: 'Unable to reset password. Please try again.' 
      });
    }
  },

  verifyToken: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Token missing',
          message: 'Authorization header missing or malformed' 
        });
      }

      const token = authHeader.split(' ')[1];
      
      // Verify JWT token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: 'Token expired',
            message: 'Authentication token has expired. Please log in again.' 
          });
        } else if (jwtError.name === 'JsonWebTokenError') {
          return res.status(401).json({ 
            error: 'Invalid token',
            message: 'Authentication token is invalid' 
          });
        } else {
          return res.status(401).json({ 
            error: 'Token verification failed',
            message: 'Unable to verify authentication token' 
          });
        }
      }
      
      // Find user and check if still active
      const user = await User.findById(decoded.userId).select('-password -passwordResetToken -passwordResetExpires');
      
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'Token valid but user no longer exists' 
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          error: 'Account deactivated',
          message: 'Your account has been deactivated' 
        });
      }

      if (user.passwordChangedAt) {
        const tokenIssuedAt = new Date(decoded.iat * 1000);
        if (tokenIssuedAt < user.passwordChangedAt) {
          return res.status(401).json({ 
            error: 'Token invalid',
            message: 'Password was changed after this token was issued. Please log in again.' 
          });
        }
      }

      res.status(200).json({ 
        message: 'Token verified successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
          preferences: user.preferences,
          stats: user.stats,
          lastLogin: user.lastLogin
        }
      });

    } catch (err) {
      console.error('Token verification error:', err);
      res.status(500).json({ 
        error: 'Token verification failed',
        message: 'Unable to verify token' 
      });
    }
  }
};

export default authController;
