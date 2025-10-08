import express from 'express';
import questionController from '../controllers/questionController.js';
const router = express.Router();

router.get('/', questionController.getQuestion);
router.get('/popular', questionController.getPopularQuestions);
router.get('/:id', questionController.getQuestionById);

export default router;