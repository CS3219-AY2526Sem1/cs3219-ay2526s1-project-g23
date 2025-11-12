import MatchSession from '../models/MatchSession.js';
import redisService from '../services/redisService.js';

class MatchingController {

  constructor() {
    this.submitMatchRequest = this.submitMatchRequest.bind(this);
    this.cancelMatchRequest = this.cancelMatchRequest.bind(this);
    this.acceptMatchProposal = this.acceptMatchProposal.bind(this);
    this.declineMatchProposal = this.declineMatchProposal.bind(this);
    this.getMatchStatus = this.getMatchStatus.bind(this);
    this.getQueueStats = this.getQueueStats.bind(this);
    this.updateParticipantStatus = this.updateParticipantStatus.bind(this);
    this.updateSessionStatus = this.updateSessionStatus.bind(this);
  }
  
  static PROFICIENCY_LEVELS = {
    'beginner': 0,
    'intermediate': 1,
    'advanced': 2
  };
  
  static DIFFICULTY_LEVELS = {
    'easy': 0,
    'medium': 1,
    'hard': 2
  };
  
  // Submit a match request
  async submitMatchRequest(req, res) {
    try {
      const { userId, username } = req.user; 
      const { topic, difficulty, proficiency, language = 'python' } = req.body;
      
      if (!topic || !difficulty || !proficiency) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Topic, difficulty, and proficiency are required'
        });
      }

      // Check if user has active matchSession first
      const activeMatchSession = await MatchSession.findOne({ 
        'participants.userId': userId, 
        'participants.status': 'active',
      });

      
      const existingRequest = await redisService.hasActiveRequest(userId);
      
      if (existingRequest || activeMatchSession) {
        return res.status(409).json({
          error: 'Active request exists',
          message: 'You already have an active match request/session'
        });
      }
      
      const queueData = await redisService.addToQueue(userId, username, topic, proficiency, difficulty, language);
      
      const match = await this.findMatch(userId, username, { topic, difficulty, proficiency, language });
      
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
  
  async findMatch(userId, username, criteria) {
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
        { id: userId, username },
        { id: partner.userId, username: partner.username },
        criteria,
        {
          topic: partner.topic,
          difficulty: partner.difficulty,
          proficiency: partner.proficiency,
          language: partner.language,
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
    if (criteria1.topic !== criteria2.topic) {
      return false;
    }
    
    const prof1Level = MatchingController.PROFICIENCY_LEVELS[criteria1.proficiency];
    const prof2Level = MatchingController.PROFICIENCY_LEVELS[criteria2.proficiency];
    const proficiencyDiff = Math.abs(prof1Level - prof2Level);
    
    if (proficiencyDiff >= 2) {
      return false;
    }
    
    if (criteria1.language && criteria2.language && criteria1.language !== criteria2.language) {
      return false;
    }
    
    return true;
  }
  
  // Create a match session between two users
  async createMatchSession(user1, user2, criteria1, criteria2) {
    try {
      const sessionCriteria = this.resolveSessionCriteria(criteria1, criteria2);
      
      // Fetch a question for the session
      const questionId = await this.getQuestionId(sessionCriteria, user1.id, user2.id);
      const participants = [
        {
          userId: user1.id,
          username: user1.username, 
          originalCriteria: criteria1,
          status: 'active'
        },
        {
          userId: user2.id,
          username: user2.username, 
          originalCriteria: criteria2,
          status: 'active'
        }
      ];
      
      // Create session
      const session = new MatchSession({
        participants,
        sessionCriteria,
        questionId: questionId,
        collaborationRoom: {
          roomId: this.generateRoomId(),
          createdAt: new Date()
        },
        matchingAlgorithm: 'exact-topic-proximity-proficiency',
        matchScore: this.calculateMatchScore(criteria1, criteria2)
      });
      
      await session.save();
      
      await redisService.redis.hincrby('matching:stats', 'totalMatched', 1);
      
      return session;
      
    } catch (err) {
      console.error('Create match session error:', err);
      throw err;
    }
  }
  
  resolveSessionCriteria(criteria1, criteria2) {
    return {
      topic: criteria1.topic, 
      
      difficulty: this.getLowerDifficulty(criteria1.difficulty, criteria2.difficulty),
      
      proficiency: this.resolveProficiency(criteria1.proficiency, criteria2.proficiency),
      
      language: criteria1.language || criteria2.language || 'python'
    };
  }
  
  // Get the lower difficulty between two difficulties
  getLowerDifficulty(diff1, diff2) {
    const level1 = MatchingController.DIFFICULTY_LEVELS[diff1];
    const level2 = MatchingController.DIFFICULTY_LEVELS[diff2];
    
    return level1 <= level2 ? diff1 : diff2;
  }
  
  resolveProficiency(prof1, prof2) {
    const level1 = MatchingController.PROFICIENCY_LEVELS[prof1];
    const level2 = MatchingController.PROFICIENCY_LEVELS[prof2];
    
    return level1 <= level2 ? prof1 : prof2;
  }
  
  calculateMatchScore(criteria1, criteria2) {
    let score = 0;
    
    if (criteria1.topic === criteria2.topic) score += 40;
    
    const profDiff = Math.abs(
      MatchingController.PROFICIENCY_LEVELS[criteria1.proficiency] - 
      MatchingController.PROFICIENCY_LEVELS[criteria2.proficiency]
    );
    
    if (profDiff === 0) score += 30; // Exact match
    else if (profDiff === 1) score += 20; // Compatible match
    
    const diffDiff = Math.abs(
      MatchingController.DIFFICULTY_LEVELS[criteria1.difficulty] - 
      MatchingController.DIFFICULTY_LEVELS[criteria2.difficulty]
    );
    
    if (diffDiff === 0) score += 20; 
    else if (diffDiff === 1) score += 10; 
    
    if (criteria1.language === criteria2.language) score += 10;
    
    return score;
  }
  
  async notifyMatchProposal(userId1, userId2, proposalId, sessionCriteria) {
    const proposalNotification = {
      type: 'match_proposal',
      proposalId,
      partnerId: null,
      sessionCriteria,
      expiresIn: 60000
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
      
      const activeProposal = await redisService.getUserActiveProposal(userId);
      
      if (activeProposal) {
        await redisService.declineMatchProposal(userId, activeProposal.proposalId);
        
        const partner = userId === activeProposal.user1.id ? activeProposal.user2 : activeProposal.user1;
        
        await redisService.notifyUser(partner.id, {
          type: 'match_cancelled',
          message: 'Your match partner cancelled the request. You will be returned to the queue.'
        });
        
        const partnerCriteria = userId === activeProposal.user1.id ? activeProposal.criteria2 : activeProposal.criteria1;
        await redisService.addToQueue(
          partner.id,
          partnerCriteria.topic,
          partnerCriteria.proficiency,
          partnerCriteria.difficulty,
          partnerCriteria.language
        );
        
        await redisService.cleanupMatchProposal(activeProposal.proposalId, activeProposal.user1.id, activeProposal.user2.id);
        
        return res.status(200).json({
          message: 'Match proposal cancelled successfully'
        });
      }
      
      const hasActiveRequest = await redisService.hasActiveRequest(userId);
      
      if (!hasActiveRequest) {
        return res.status(404).json({
          error: 'No active request',
          message: 'No pending match request found'
        });
      }
      
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
          proposal.user1, 
          proposal.user2, 
          proposal.criteria1, 
          proposal.criteria2
        );
        
        // Notify both users of confirmed match
        await this.notifyUsers(proposal.user1.id, proposal.user2.id, session);
        
        // Clean up proposal
        await redisService.cleanupMatchProposal(proposalId, proposal.user1.id, proposal.user2.id);
        
        return res.status(200).json({
          message: 'Match confirmed! Both users accepted.',
          session: session,
          partnerId: userId === proposal.user1.id ? proposal.user2.id : proposal.user1.id
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
      const partner = userId === proposal.user1.id ? proposal.user2 : proposal.user1;
      
      // Notify partner in real time
      await redisService.notifyUser(partner.id, {
        type: 'match_declined',
        message: 'Your match partner declined the match. You will be returned to the queue.',
        declinedBy: userId
      });

      // ✅ Reset match status for both users (so polling detects the decline)
      await redisService.setMatchStatus(userId, 'none');
      await redisService.setMatchStatus(partner.id, 'none');
      
      // Add partner back to the queue
      const partnerCriteria = userId === proposal.user1.id ? proposal.criteria2 : proposal.criteria1;
      await redisService.addToQueue(
        partner.id,
        partnerCriteria.topic,
        partnerCriteria.proficiency,
        partnerCriteria.difficulty,
        partnerCriteria.language
      );
      
      // Clean up proposal data (remove proposal keys)
      await redisService.cleanupMatchProposal(partner.id, proposal.user1.id, proposal.user2.id);
      
      return res.status(200).json({
        message: 'Match proposal declined. Partner has been notified.'
      });

    } catch (err) {
      console.error('Decline match proposal error:', err);
      return res.status(500).json({
        error: 'Failed to decline match proposal',
        message: err.message
      });
    }
  }

    
  // Get match status for user
  async getMatchStatus(req, res) {
    try {
      const { userId } = req.user;
      
      // Check for active session first
      const activeSession = await MatchSession.findOne({
        participants: { $elemMatch: { userId: userId, status: 'active' } },
      });
      
      if (activeSession) {
        const partner = activeSession.participants.find(p => p.userId.toString() !== userId);
        return res.status(200).json({
          status: 'active',
          session: activeSession,
          partnerId: partner ? partner.userId : null
        });
      } 
      
      const activeProposal = await redisService.getUserActiveProposal(userId);
      
      if (activeProposal) {
        const partnerId = userId === activeProposal.user1.id ? activeProposal.user2.id : activeProposal.user1.id;
        const userAccepted = userId === activeProposal.user1.id ? activeProposal.user1Accepted : activeProposal.user2Accepted;
        const partnerAccepted = userId === activeProposal.user1.id ? activeProposal.user2Accepted : activeProposal.user1Accepted;
        
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
      
      const hasActiveRequest = await redisService.hasActiveRequest(userId);
      
      if (!hasActiveRequest) {
        return res.status(200).json({
          status: 'none',
          message: 'No active match request'
        });
      }
      
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
        queuePosition: position + 1, 
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
  
  async getMatchSession(req, res) {
    try {
      const { userId } = req.user;
      const { sessionId } = req.params;

      const session = await MatchSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (!session.participants.find(({ userId: id }) => id.toString() == userId)) {
        return res.status(500).json({ error: 'Failed to get match session' });
      }

      res.status(200).json(session);
    } catch (err) {
      console.error('Get match session error:', err);
      res.status(500).json({
        error: 'Failed to get match session',
        message: err.message,
      });
    }
  }
  
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
  
  generateRoomId() {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  estimateWaitTime(topic, position) {
    return Math.min(30, Math.max(5, position * 5));
  }

  async getQuestionId(sessionCriteria, userId1, userId2) {
    try {
      const { topic, difficulty } = sessionCriteria;
      
      console.log(`Fetching question from question service: topic=${topic}, difficulty=${difficulty}, users=${userId1},${userId2}`);
      
      const questionServiceUrl = process.env.QUESTION_SERVICE_URL || 'http://localhost:3002';
      
      const response = await fetch(`${questionServiceUrl}/questions?type=${encodeURIComponent(topic)}&difficulty=${encodeURIComponent(difficulty)}`);
      
      if (!response.ok) {
        throw new Error(`Question service returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.questions || data.questions.length === 0) {
        console.warn(`No questions found for topic: ${topic}, difficulty: ${difficulty}`);
        return null;
      }
      
      const userHistory1 = await this.getUserQuestionHistory(userId1);
      const userHistory2 = await this.getUserQuestionHistory(userId2);
      
      const questions = data.questions;
      
      const strategies = [
        {
          name: 'questionsNotDoneByBoth',
          selector: (q, h1, h2) => !h1.includes(q._id) && !h2.includes(q._id),
          message: 'Selected question not done by both users'
        },
        {
          name: 'questionsNotDoneByOne',
          selector: (q, h1, h2) => !h1.includes(q._id) || !h2.includes(q._id),
          message: 'Selected question not done by one user'
        },
        {
          name: 'anyQuestion',
          selector: () => true, 
          message: 'All questions done by both users, selected random'
        }
      ];
      
      for (const strategy of strategies) {
        const filteredQuestions = questions.filter(question => 
          strategy.selector(question, userHistory1, userHistory2)
        );
        
        if (filteredQuestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
          const selectedQuestion = filteredQuestions[randomIndex];
          console.log(`${strategy.message}: ${selectedQuestion._id}`);
          return selectedQuestion._id;
        }
      }
      
    } catch (err) {
      console.error('Error fetching random question from question service:', err);
      return null;
    }
  }

  async getUserQuestionHistory(userId) {
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';

      const response = await fetch(`${userServiceUrl}/users/${userId}/attempted-questionIds`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch attempts history for user ${userId}: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      return data.completedQuestions || [];
      
    } catch (err) {
      console.error(`Error fetching attempts history for user ${userId}:`, err);
      return [];
    }
  }
  // Update participant status in match session
  async updateParticipantStatus(req, res) {
    try {
      const { userId } = req.user;
      const { sessionId } = req.params;
      const { status } = req.body;

      if (!status || !['active', 'completed'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Status must be either "active" or "completed"'
        });
      }

      // Find the match session
      const session = await MatchSession.findById(sessionId);
      
      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Match session not found'
        });
      }

      // Check if user is a participant in this session
      const participant = session.participants.find(p => p.userId.toString() === userId);
      
      if (!participant) {
        return res.status(403).json({
          error: 'Not authorized',
          message: 'You are not a participant in this session'
        });
      }

      // Update participant status
      participant.status = status;

      // Save the session
      await session.save();

      res.status(200).json({
        message: `Participant status updated to ${status}`,
        session: session,
        participant: participant
      });

    } catch (err) {
      console.error('Update participant status error:', err);
      res.status(500).json({
        error: 'Failed to update participant status',
        message: err.message
      });
    }
  }
  // Update session status
  async updateSessionStatus(req, res) {
    try {
      const { userId } = req.user;
      const { sessionId } = req.params;
      const { status } = req.body;

      if (!status || !['active', 'completed'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Status must be one of: active, completed'
        });
      }

      // Find the match session
      const session = await MatchSession.findById(sessionId);
      
      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Match session not found'
        });
      }

      // Check if user is a participant in this session
      const isParticipant = session.participants.some(p => p.userId.toString() === userId);
      
      if (!isParticipant) {
        return res.status(403).json({
          error: 'Not authorized',
          message: 'You are not a participant in this session'
        });
      }

      // Update session status
      session.status = status;

      // Set timestamps based on status change
      if (status === 'completed' && !session.endedAt) {
        session.endedAt = new Date();
      }
      
      // Set the duration if endedAt is set
      if (session.endedAt && session.startedAt) {
        session.duration = Math.floor((session.endedAt - session.startedAt) / 1000);
      }
      // Save the session
      await session.save();

      res.status(200).json({
        message: `Session status updated to ${status}`,
        session: session
      });

    } catch (err) {
      console.error('Update session status error:', err);
      res.status(500).json({
        error: 'Failed to update session status',
        message: err.message
      });
    }
  }
}

export default new MatchingController();