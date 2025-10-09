import express from 'express';
import attemptController from '../controllers/attemptController.js';
import authMiddleware from '../middleware/authMiddleware.js'; // Protect endpoint

const router = express.Router();

// POST /api/attempts
router.post('/', authMiddleware, attemptController.recordAttempt);

export default router;