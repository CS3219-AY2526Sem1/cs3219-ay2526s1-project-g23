import express from 'express';
import questionController from '../controllers/questionController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', questionController.getQuestion);
router.get('/popular', questionController.getPopularQuestions);
router.get('/:id', questionController.getQuestionById);

// CRUD routes
router.post('/create', authMiddleware, questionController.createQuestion);
router.put('/:id/update', authMiddleware, questionController.updateQuestion);
router.patch('/:id/activate', authMiddleware, questionController.activateQuestion);      // Activate specific question
router.patch('/:id/deactivate', authMiddleware, questionController.deactivateQuestion);  // Inactivate specific question
router.delete('/:id/delete', authMiddleware, questionController.deleteQuestion);

export default router;