import express from 'express';
import attemptController from '../controllers/attemptController.js';

const router = express.Router();

// POST /api/attempts
router.post('/', attemptController.recordAttempt);

export default router;