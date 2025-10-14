import express from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authMiddleware, authController.changePassword);
router.get('/verify-token', authController.verifyToken);

export default router;
