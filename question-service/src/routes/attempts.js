import express from 'express';
import attemptController from '../controllers/attemptController.js';

const router = express.Router();

router.get('/', attemptController.getAttempts);
router.get('/:userId', attemptController.getAttempts);
router.post('/', attemptController.recordAttempt);

export default router;
