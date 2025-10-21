import express from 'express';
import matchingController from '../controllers/matchingController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Submit a new match request
router.post('/request', authMiddleware, matchingController.submitMatchRequest);

// Cancel current match request  
router.delete('/cancel', authMiddleware, matchingController.cancelMatchRequest);

// Accept match proposal
router.post('/proposal/:proposalId/accept', authMiddleware, matchingController.acceptMatchProposal);

// Decline match proposal
router.post('/proposal/:proposalId/decline', authMiddleware, matchingController.declineMatchProposal);

// Get current match status
router.get('/status', authMiddleware, matchingController.getMatchStatus);

// Get queue statistics (admin or public)
router.get('/stats', matchingController.getQueueStats);
export default router;