import MatchRequest from '../models/MatchRequest.js';
import MatchSession from '../models/MatchSession.js';
import redisService from '../services/redisService.js';

class MatchingController {
  
  // Proficiency level mapping for compatibility checking
  static PROFICIENCY_LEVELS = {
    'beginner': 0,
    'intermediate': 1,
    'pro': 2
  };
  
  // Difficulty level mapping for selection (lower difficulty wins)
  static DIFFICULTY_LEVELS = {
    'easy': 0,
    'medium': 1,
    'hard': 2
  };
  
  // Submit a match request
  async submitMatchRequest(req, res) {
    try {
      const { userId } = req.user; 
      const { topic, difficulty, proficiency, language = 'python' } = req.body;
      
      if (!topic || !difficulty || !proficiency) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Topic, difficulty, and proficiency are required'
        });
      }
      
      // Check if user already has an active request in Redis (not MongoDB)
      const existingRequest = await redisService.redis.exists(redisService.getActiveRequestKey(userId));
      
      if (existingRequest) {
        return res.status(409).json({
          error: 'Active request exists',
          message: 'You already have an active match request'
        });
      }
      
      const queueData = await redisService.addToQueue(userId, topic, proficiency, difficulty, language);
      
      const match = await this.findMatch(userId, { topic, difficulty, proficiency, language });
      
      if (match) {
        return res.status(200).json({
          message: 'Match found!',
          match: match.session,
          partnerId: match.partnerId
        });
      } else {
        return res.status(202).json({
          message: 'Added to matching queue',
          queuePosition: queueData.position,
          estimatedWait: this.estimateWaitTime(topic, queueData.position)
        });
      }
      
    } catch (err) {
      console.error('Submit match request error:', err);
      res.status(500).json({
        error: 'Failed to submit match request',
        message: err.message
      });
    }
  }
  
  async findMatch(userId, criteria) {
    try {
      const { topic, difficulty, proficiency, language } = criteria;
      
      const queueUsers = await redisService.getQueueUsers(topic);
      
      const compatibleUsers = queueUsers
        .filter(user => user.userId !== userId)
        .filter(user => this.isCompatible(criteria, {
          topic: user.topic,
          difficulty: user.difficulty,
          proficiency: user.proficiency,
          language: user.language
        }))
        .sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)); 
      
      if (compatibleUsers.length === 0) {
        return null; 
      }
      
      const partner = compatibleUsers[0];
      
      // Create match proposal instead of immediate session
      const sessionCriteria = this.resolveSessionCriteria(criteria, {
        topic: partner.topic,
        difficulty: partner.difficulty,
        proficiency: partner.proficiency,
        language: partner.language
      });
      
      const proposalId = await redisService.createMatchProposal(
        userId, 
        partner.userId, 
        criteria,
        {
          topic: partner.topic,
          difficulty: partner.difficulty,
          proficiency: partner.proficiency,
          language: partner.language
        },
        sessionCriteria
      );
      
      // Remove both users from queue
      await redisService.removeFromQueue(userId, topic);
      await redisService.removeFromQueue(partner.userId, topic);
      
      // Notify both users of match proposal
      await this.notifyMatchProposal(userId, partner.userId, proposalId, sessionCriteria);
      
      return {
        proposalId,
        partnerId: partner.userId,
        sessionCriteria
      };
      
    } catch (err) {
      console.error('Find match error:', err);
      throw err;
    }
  }
  
  isCompatible(criteria1, criteria2) {
    // 1. Topic must be exactly the same
    if (criteria1.topic !== criteria2.topic) {
      return false;
    }
    
    // 2. Proficiency can be off by 1 level but not by 2
    const prof1Level = MatchingController.PROFICIENCY_LEVELS[criteria1.proficiency];
    const prof2Level = MatchingController.PROFICIENCY_LEVELS[criteria2.proficiency];
    const proficiencyDiff = Math.abs(prof1Level - prof2Level);
    
    if (proficiencyDiff >= 2) {
      return false;
    }
    
    // 3. Language should match (optional, can be relaxed)
    if (criteria1.language && criteria2.language && criteria1.language !== criteria2.language) {
      return false;
    }
    
    return true;
  }
  
  // Create a match session between two users
  async createMatchSession(userId1, userId2, criteria1, criteria2) {
    try {
      const sessionCriteria = this.resolveSessionCriteria(criteria1, criteria2);
      
      const participants = [
        {
          userId: userId1,
          username: `user_${userId1}`, // TODO: Fetch actual username from user service
          originalCriteria: criteria1
        },
        {
          userId: userId2,
          username: `user_${userId2}`, // TODO: Fetch actual username from user service  
          originalCriteria: criteria2
        }
      ];
      
      // Create session
      const session = new MatchSession({
        participants,
        sessionCriteria,
        collaborationRoom: {
          roomId: this.generateRoomId(),
          createdAt: new Date()
        },
        matchingAlgorithm: 'exact-topic-proximity-proficiency',
        matchScore: this.calculateMatchScore(criteria1, criteria2)
      });
      
      await session.save();
      
      // Update Redis statistics
      await redisService.redis.hincrby('matching:stats', 'totalMatched', 1);
      
      return session;
      
    } catch (err) {
      console.error('Create match session error:', err);
      throw err;
    }
  }
  
  // Resolve final session criteria based on your rules
  resolveSessionCriteria(criteria1, criteria2) {
    return {
      topic: criteria1.topic, 
      
      // Choose lower difficulty between the two users
      difficulty: this.getLowerDifficulty(criteria1.difficulty, criteria2.difficulty),
      
      proficiency: this.resolveProficiency(criteria1.proficiency, criteria2.proficiency),
      
      // Language preference (first user's preference or common one)
      language: criteria1.language || criteria2.language || 'python'
    };
  }
  
  // Get the lower difficulty between two difficulties
  getLowerDifficulty(diff1, diff2) {
    const level1 = MatchingController.DIFFICULTY_LEVELS[diff1];
    const level2 = MatchingController.DIFFICULTY_LEVELS[diff2];
    
    return level1 <= level2 ? diff1 : diff2;
  }
  
  // Resolve proficiency level (take the lower one for better learning experience)
  resolveProficiency(prof1, prof2) {
    const level1 = MatchingController.PROFICIENCY_LEVELS[prof1];
    const level2 = MatchingController.PROFICIENCY_LEVELS[prof2];
    
    return level1 <= level2 ? prof1 : prof2;
  }
  
  // Calculate compatibility score for analytics
  calculateMatchScore(criteria1, criteria2) {
    let score = 0;
    
    // Same topic = 40 points
    if (criteria1.topic === criteria2.topic) score += 40;
    
    // Proficiency compatibility
    const profDiff = Math.abs(
      MatchingController.PROFICIENCY_LEVELS[criteria1.proficiency] - 
      MatchingController.PROFICIENCY_LEVELS[criteria2.proficiency]
    );
    
    if (profDiff === 0) score += 30; // Exact match
    else if (profDiff === 1) score += 20; // Compatible match
    
    // Difficulty compatibility
    const diffDiff = Math.abs(
      MatchingController.DIFFICULTY_LEVELS[criteria1.difficulty] - 
      MatchingController.DIFFICULTY_LEVELS[criteria2.difficulty]
    );
    
    if (diffDiff === 0) score += 20; 
    else if (diffDiff === 1) score += 10; 
    
    if (criteria1.language === criteria2.language) score += 10;
    
    return score;
  }
  
  // Notify both users about the match proposal
  async notifyMatchProposal(userId1, userId2, proposalId, sessionCriteria) {
    const proposalNotification = {
      type: 'match_proposal',
      proposalId,
      partnerId: null,
      sessionCriteria,
      expiresIn: 60000 // 60 seconds to accept
    };
    
    await redisService.notifyUser(userId1, {
      ...proposalNotification,
      partnerId: userId2
    });
    
    await redisService.notifyUser(userId2, {
      ...proposalNotification,
      partnerId: userId1
    });
  }
  
  // Notify both users about the match (when both accept)
  async notifyUsers(userId1, userId2, session) {
    const matchNotification = {
      type: 'match_confirmed',
      sessionId: session._id,
      partnerId: null, 
      sessionCriteria: session.sessionCriteria,
      collaborationRoom: session.collaborationRoom
    };
    
    await redisService.notifyUser(userId1, {
      ...matchNotification,
      partnerId: userId2
    });
    
    await redisService.notifyUser(userId2, {
      ...matchNotification,
      partnerId: userId1
    });
  }
  
  // Cancel match request
  async cancelMatchRequest(req, res) {
    try {
      const { userId } = req.user;
      
      // Check if user has an active proposal first
      const activeProposal = await redisService.getUserActiveProposal(userId);
      
      if (activeProposal) {
        // Decline the proposal
        await redisService.declineMatchProposal(userId, activeProposal.proposalId);
        
        const partnerId = userId === activeProposal.user1Id ? activeProposal.user2Id : activeProposal.user1Id;
        
        // Notify partner
        await redisService.notifyUser(partnerId, {
          type: 'match_cancelled',
          message: 'Your match partner cancelled the request. You will be returned to the queue.'
        });
        
        // Add partner back to queue
        const partnerCriteria = userId === activeProposal.user1Id ? activeProposal.criteria2 : activeProposal.criteria1;
        await redisService.addToQueue(
          partnerId,
          partnerCriteria.topic,
          partnerCriteria.proficiency,
          partnerCriteria.difficulty,
          partnerCriteria.language
        );
        
        // Clean up proposal
        await redisService.cleanupMatchProposal(activeProposal.proposalId, activeProposal.user1Id, activeProposal.user2Id);
        
        return res.status(200).json({
          message: 'Match proposal cancelled successfully'
        });
      }
      
      // Check if user has active request in Redis queue
      const hasActiveRequest = await redisService.hasActiveRequest(userId);
      
      if (!hasActiveRequest) {
        return res.status(404).json({
          error: 'No active request',
          message: 'No pending match request found'
        });
      }
      
      // Remove from all possible topic queues (Redis handles this efficiently)
      const topics = ['Arrays', 'Strings', 'Algorithms', 'Data Structures', 'Brainteasers'];
      for (const topic of topics) {
        await redisService.removeFromQueue(userId, topic);
      }
      
      res.status(200).json({
        message: 'Match request cancelled successfully'
      });
      
    } catch (err) {
      console.error('Cancel match request error:', err);
      res.status(500).json({
        error: 'Failed to cancel match request',
        message: err.message
      });
    }
  }
  
  // Accept match proposal
  async acceptMatchProposal(req, res) {
    try {
      const { userId } = req.user;
      const { proposalId } = req.params;
      
      const result = await redisService.acceptMatchProposal(userId, proposalId);
      
      if (!result.success) {
        return res.status(400).json({
          error: result.error
        });
      }
      
      if (result.bothAccepted) {
        // Both users accepted - create persistent records
        const proposal = result.proposal;
        
        // Create match session
        const session = await this.createMatchSession(
          proposal.user1Id, 
          proposal.user2Id, 
          proposal.criteria1, 
          proposal.criteria2
        );
        
        // Create match request records in MongoDB
        await MatchRequest.create([
          {
            userId: proposal.user1Id,
            criteria: proposal.criteria1,
            status: 'matched',
            matchedWith: proposal.user2Id,
            sessionId: session._id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          },
          {
            userId: proposal.user2Id,
            criteria: proposal.criteria2,
            status: 'matched',
            matchedWith: proposal.user1Id,
            sessionId: session._id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        ]);
        
        // Notify both users of confirmed match
        await this.notifyUsers(proposal.user1Id, proposal.user2Id, session);
        
        // Clean up proposal
        await redisService.cleanupMatchProposal(proposalId, proposal.user1Id, proposal.user2Id);
        
        return res.status(200).json({
          message: 'Match confirmed! Both users accepted.',
          session: session,
          partnerId: userId === proposal.user1Id ? proposal.user2Id : proposal.user1Id
        });
      }
      
      res.status(200).json({
        message: 'Your acceptance recorded. Waiting for partner to accept.',
        waitingForPartner: true
      });
      
    } catch (err) {
      console.error('Accept match proposal error:', err);
      res.status(500).json({
        error: 'Failed to accept match proposal',
        message: err.message
      });
    }
  }
  
  // Decline match proposal
  async declineMatchProposal(req, res) {
    try {
      const { userId } = req.user;
      const { proposalId } = req.params;
      
      const result = await redisService.declineMatchProposal(userId, proposalId);
      
      if (!result.success) {
        return res.status(400).json({
          error: result.error
        });
      }
      
      const proposal = result.proposal;
      const partnerId = userId === proposal.user1Id ? proposal.user2Id : proposal.user1Id;
      
      // Notify partner that match was declined
      await redisService.notifyUser(partnerId, {
        type: 'match_declined',
        message: 'Your match partner declined the match. You will be returned to the queue.',
        declinedBy: userId
      });
      
      // Add partner back to queue
      const partnerCriteria = userId === proposal.user1Id ? proposal.criteria2 : proposal.criteria1;
      await redisService.addToQueue(
        partnerId,
        partnerCriteria.topic,
        partnerCriteria.proficiency,
        partnerCriteria.difficulty,
        partnerCriteria.language
      );
      
      // Clean up proposal
      await redisService.cleanupMatchProposal(proposalId, proposal.user1Id, proposal.user2Id);
      
      res.status(200).json({
        message: 'Match proposal declined. Partner has been notified.'
      });
      
    } catch (err) {
      console.error('Decline match proposal error:', err);
      res.status(500).json({
        error: 'Failed to decline match proposal',
        message: err.message
      });
    }
  }
  
  // Get match status for user
  async getMatchStatus(req, res) {
    try {
      const { userId } = req.user;
      
      // First check if user has a completed match session in MongoDB
      const completedMatch = await MatchRequest.findOne({ 
        userId, 
        status: 'matched' 
      }).populate('sessionId');
      
      if (completedMatch) {
        return res.status(200).json({
          status: 'matched',
          session: completedMatch.sessionId,
          partnerId: completedMatch.matchedWith
        });
      }
      
      // Check if user has an active match proposal
      const activeProposal = await redisService.getUserActiveProposal(userId);
      
      if (activeProposal) {
        const partnerId = userId === activeProposal.user1Id ? activeProposal.user2Id : activeProposal.user1Id;
        const userAccepted = userId === activeProposal.user1Id ? activeProposal.user1Accepted : activeProposal.user2Accepted;
        const partnerAccepted = userId === activeProposal.user1Id ? activeProposal.user2Accepted : activeProposal.user1Accepted;
        
        return res.status(200).json({
          status: 'proposal_pending',
          proposalId: activeProposal.proposalId,
          partnerId: partnerId,
          sessionCriteria: activeProposal.sessionCriteria,
          userAccepted: userAccepted,
          partnerAccepted: partnerAccepted,
          createdAt: new Date(activeProposal.createdAt),
          expiresIn: Math.max(0, (activeProposal.createdAt + 60000) - Date.now())
        });
      }
      
      // Check if user has active request in Redis queue
      const hasActiveRequest = await redisService.hasActiveRequest(userId);
      
      if (!hasActiveRequest) {
        return res.status(200).json({
          status: 'none',
          message: 'No active match request'
        });
      }
      
      // Get user's request details and queue position from Redis
      const topics = ['Arrays', 'Strings', 'Algorithms', 'Data Structures', 'Brainteasers'];
      let userRequest = null;
      let position = -1;
      
      for (const topic of topics) {
        const queueUsers = await redisService.getQueueUsers(topic);
        const user = queueUsers.find(u => u.userId === userId);
        if (user) {
          userRequest = user;
          position = queueUsers.findIndex(u => u.userId === userId);
          break;
        }
      }
      
      if (!userRequest) {
        return res.status(200).json({
          status: 'none',
          message: 'No active match request found'
        });
      }
      
      res.status(200).json({
        status: 'pending',
        criteria: {
          topic: userRequest.topic,
          difficulty: userRequest.difficulty,
          proficiency: userRequest.proficiency,
          language: userRequest.language
        },
        queuePosition: position + 1, // Make it 1-indexed for users
        createdAt: new Date(parseInt(userRequest.timestamp)),
        estimatedWait: this.estimateWaitTime(userRequest.topic, position)
      });
      
    } catch (err) {
      console.error('Get match status error:', err);
      res.status(500).json({
        error: 'Failed to get match status',
        message: err.message
      });
    }
  }
  
  // Get queue statistics (admin endpoint)
  async getQueueStats(req, res) {
    try {
      const stats = await redisService.getQueueStats();
      res.status(200).json(stats);
    } catch (err) {
      console.error('Get queue stats error:', err);
      res.status(500).json({
        error: 'Failed to get queue statistics',
        message: err.message
      });
    }
  }
  
  // Utility functions
  generateRoomId() {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  estimateWaitTime(topic, position) {
    // Simple estimation: 5 seconds per position ahead, max 30 seconds
    return Math.min(30, Math.max(5, position * 5));
  }
}

export default new MatchingController();