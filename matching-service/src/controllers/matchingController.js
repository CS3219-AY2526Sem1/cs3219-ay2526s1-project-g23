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
      const { topic, difficulty, proficiency, language = 'javascript' } = req.body;
      
      if (!topic || !difficulty || !proficiency) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Topic, difficulty, and proficiency are required'
        });
      }
      
      const existingRequest = await MatchRequest.findOne({ 
        userId, 
        status: 'pending' 
      });
      
      if (existingRequest) {
        return res.status(409).json({
          error: 'Active request exists',
          message: 'You already have an active match request'
        });
      }
      
      const matchRequest = new MatchRequest({
        userId,
        criteria: { topic, difficulty, proficiency, language }
      });
      
      await matchRequest.save();
      
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
      
      // Create match session
      const session = await this.createMatchSession(userId, partner.userId, criteria, {
        topic: partner.topic,
        difficulty: partner.difficulty,
        proficiency: partner.proficiency,
        language: partner.language
      });
      
      // Remove both users from Redis queue
      await redisService.removeFromQueue(userId, topic);
      await redisService.removeFromQueue(partner.userId, topic);
      
      // Update match requests in MongoDB
      await MatchRequest.updateMany(
        { userId: { $in: [userId, partner.userId] }, status: 'pending' },
        { 
          status: 'matched',
          matchedWith: { $cond: [{ $eq: ['$userId', userId] }, partner.userId, userId] },
          sessionId: session._id
        }
      );
      
      // Notify both users
      await this.notifyUsers(userId, partner.userId, session);
      
      return {
        session,
        partnerId: partner.userId
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
      
      language: criteria1.language || criteria2.language || 'javascript'
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
  
  // Notify both users about the match
  async notifyUsers(userId1, userId2, session) {
    const matchNotification = {
      type: 'match_found',
      sessionId: session._id,
      partnerId: null, 
      sessionCriteria: session.sessionCriteria,
      collaborationRoom: session.collaborationRoom,
      expiresIn: 30000 // 30 seconds to accept
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
      
      const matchRequest = await MatchRequest.findOne({ 
        userId, 
        status: 'pending' 
      });
      
      if (!matchRequest) {
        return res.status(404).json({
          error: 'No active request',
          message: 'No pending match request found'
        });
      }
      
      await redisService.removeFromQueue(userId, matchRequest.criteria.topic);
      
      matchRequest.status = 'cancelled';
      await matchRequest.save();
      
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
  
  // Get match status for user
  async getMatchStatus(req, res) {
    try {
      const { userId } = req.user;
      
      // Check for active request
      const matchRequest = await MatchRequest.findOne({ 
        userId, 
        status: { $in: ['pending', 'matched'] }
      }).populate('sessionId');
      
      if (!matchRequest) {
        return res.status(200).json({
          status: 'none',
          message: 'No active match request'
        });
      }
      
      if (matchRequest.status === 'matched') {
        return res.status(200).json({
          status: 'matched',
          session: matchRequest.sessionId,
          partnerId: matchRequest.matchedWith
        });
      }
      
      // Get queue position from Redis
      const position = await redisService.getQueuePosition(userId, matchRequest.criteria.topic);
      
      res.status(200).json({
        status: 'pending',
        criteria: matchRequest.criteria,
        queuePosition: position,
        createdAt: matchRequest.createdAt,
        estimatedWait: this.estimateWaitTime(matchRequest.criteria.topic, position)
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
    return Math.max(30, position * 30);
  }
}

export default new MatchingController();