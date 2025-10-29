import express from 'express';
import questionController from '../controllers/questionController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', questionController.getQuestion);
router.get('/popular', questionController.getPopularQuestions);
router.get('/:id', questionController.getQuestionById);

// CRUD routes
router.post('/create', requireAdmin, questionController.createQuestion);
router.put('/:id/update', requireAdmin, questionController.updateQuestion);
router.patch('/:id/activate', requireAdmin, questionController.activateQuestion);      // Activate specific question
router.patch('/:id/deactivate', requireAdmin, questionController.deactivateQuestion);  // Inactivate specific question
router.delete('/:id/delete', requireAdmin, questionController.deleteQuestion);

export default router;