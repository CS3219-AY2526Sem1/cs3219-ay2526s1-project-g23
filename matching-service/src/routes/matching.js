import express from "express";
import matchingController from "../controllers/matchingController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Submit a new match request
router.post("/request", authMiddleware, matchingController.submitMatchRequest);

// Accept match proposal
router.post(
  "/proposal/:proposalId/accept",
  authMiddleware,
  matchingController.acceptMatchProposal
);

// Decline match proposal
router.post(
  "/proposal/:proposalId/decline",
  authMiddleware,
  matchingController.declineMatchProposal
);

// Get current match status
router.get("/status", authMiddleware, matchingController.getMatchStatus);

// Get match session
router.get(
  "/session/:sessionId",
  authMiddleware,
  matchingController.getMatchSession
);

// Cancel current match request
router.delete("/cancel", authMiddleware, matchingController.cancelMatchRequest);

// Update participant status in a match session
router.patch(
  "/sessions/:sessionId/participant-status",
  authMiddleware,
  matchingController.updateParticipantStatus
);

// Update session status
router.patch(
  "/sessions/:sessionId/session-status",
  authMiddleware,
  matchingController.updateSessionStatus
);

router.get("/stats", matchingController.getQueueStats);
export default router;
