import express from 'express';
import userController from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

router.get('/:userId', authMiddleware, userController.getUser);
router.get('/', authMiddleware, userController.getAllUsers);
router.get('/:userId/stats', authMiddleware, userController.getUserStats);
router.patch('/:userId', authMiddleware, userController.updateUser);
router.patch('/:userId/privilege', authMiddleware, userController.updateUserPrivilege);
router.delete('/:userId', authMiddleware, userController.deleteUser);
router.post('/logout', userController.logout);

export default router;
