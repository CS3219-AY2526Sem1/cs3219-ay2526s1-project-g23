import Redis from 'ioredis';

class RedisService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      lazyConnect: false
    });
    
    this.subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined
    });
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.redis.on('connect', () => {
      console.log(' Redis connected successfully');
    });
    
    this.redis.on('error', (err) => {
      console.error(' Redis connection error:', err);
    });
  }
  
  getQueueKey(topic) {
    return `matching:queue:${topic}`;
  }
  
  getActiveRequestKey(userId) {
    return `matching:active:${userId}`;
  }
  
  getNotificationChannel(userId) {
    return `matching:notifications:${userId}`;
  }
  
  async addToQueue(userId, topic, proficiency, difficulty, language = 'python') {
    const queueKey = this.getQueueKey(topic);
    const activeKey = this.getActiveRequestKey(userId);
    const timestamp = Date.now();
    
    const requestData = {
      userId,
      topic,
      proficiency,
      difficulty,
      language,
      timestamp,
      status: 'pending'
    };
    
    const pipeline = this.redis.pipeline();
    
    pipeline.zadd(queueKey, timestamp, userId);
    
    pipeline.hmset(activeKey, requestData);
    pipeline.expire(activeKey, 30); 
    
    // Update queue statistics
    pipeline.hincrby('matching:stats', 'totalActive', 1);
    pipeline.hincrby('matching:stats', `topic:${topic}`, 1);
    
    await pipeline.exec();
    
    // Get queue position
    const position = await this.getQueuePosition(userId, topic);
    return { position, timestamp };
  }
  
  async removeFromQueue(userId, topic) {
    const queueKey = this.getQueueKey(topic);
    const activeKey = this.getActiveRequestKey(userId);
    
    const pipeline = this.redis.pipeline();
    
    pipeline.zrem(queueKey, userId);
    
    pipeline.del(activeKey);
    
    pipeline.hincrby('matching:stats', 'totalActive', -1);
    pipeline.hincrby('matching:stats', `topic:${topic}`, -1);
    
    await pipeline.exec();
  }
  
  async getQueuePosition(userId, topic) {
    const queueKey = this.getQueueKey(topic);
    const rank = await this.redis.zrank(queueKey, userId);
    return rank !== null ? rank + 1 : null;
  }
  
  async getQueueUsers(topic, limit = 100) {
    const queueKey = this.getQueueKey(topic);
    
    const userIds = await this.redis.zrange(queueKey, 0, limit - 1);
    
    if (userIds.length === 0) return [];
    
    const pipeline = this.redis.pipeline();
    userIds.forEach(userId => {
      pipeline.hgetall(this.getActiveRequestKey(userId));
    });
    
    const results = await pipeline.exec();
    
    return userIds.map((userId, index) => ({
      userId,
      ...results[index][1] 
    })).filter(user => user.userId); 
  }
  
  // Publish notification to user
  async notifyUser(userId, notification) {
    const channel = this.getNotificationChannel(userId);
    await this.redis.publish(channel, JSON.stringify(notification));
  }
  
  // Subscribe to user notifications
  async subscribeToNotifications(userId, callback) {
    const channel = this.getNotificationChannel(userId);
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const notification = JSON.parse(message);
          callback(notification);
        } catch (err) {
          console.error('Failed to parse notification:', err);
        }
      }
    });
  }
  
  // Get queue statistics
  async getQueueStats() {
    const stats = await this.redis.hgetall('matching:stats');
    
    const topics = [
      'binary-search', 'linked-list', 'stack', 'graph', 
      'sorting', 'tree', 'dynamic-programming', 'greedy',
      'arrays', 'strings', 'hash-table', 'two-pointers'
    ];
    
    const queueSizes = {};
    const pipeline = this.redis.pipeline();
    
    topics.forEach(topic => {
      pipeline.zcard(this.getQueueKey(topic));
    });
    
    const results = await pipeline.exec();
    topics.forEach((topic, index) => {
      queueSizes[topic] = results[index][1] || 0;
    });
    
    return {
      totalActive: parseInt(stats.totalActive) || 0,
      totalMatched: parseInt(stats.totalMatched) || 0,
      avgWaitTime: parseInt(stats.avgWaitTime) || 0,
      queueSizes
    };
  }
  
  // Check if user has an active request
  async hasActiveRequest(userId) {
    const activeKey = this.getActiveRequestKey(userId);
    const exists = await this.redis.exists(activeKey);
    return exists === 1;
  }
  
  async getActiveRequest(userId) {
    const activeKey = this.getActiveRequestKey(userId);
    const requestData = await this.redis.hgetall(activeKey);
    
    if (!requestData.userId) {
      return null;
    }
    
    return {
      userId: requestData.userId,
      topic: requestData.topic,
      proficiency: requestData.proficiency,
      difficulty: requestData.difficulty,
      language: requestData.language,
      timestamp: parseInt(requestData.timestamp),
      status: requestData.status
    };
  }
  
  getMatchProposalKey(proposalId) {
    return `matching:proposal:${proposalId}`;
  }
  
  getUserProposalKey(userId) {
    return `matching:user_proposal:${userId}`;
  }
  
  async createMatchProposal(user1Id, user2Id, criteria1, criteria2, sessionCriteria) {
    const proposalId = `${user1Id}_${user2Id}_${Date.now()}`;
    const proposalKey = this.getMatchProposalKey(proposalId);
    
    const proposal = {
      proposalId,
      user1Id,
      user2Id,
      criteria1: JSON.stringify(criteria1),
      criteria2: JSON.stringify(criteria2),
      sessionCriteria: JSON.stringify(sessionCriteria),
      createdAt: Date.now(),
      user1Accepted: false,
      user2Accepted: false,
      status: 'pending'
    };
    
    await this.redis.hset(proposalKey, proposal);
    await this.redis.expire(proposalKey, 60);
    
    await this.redis.setex(this.getUserProposalKey(user1Id), 60, proposalId);
    await this.redis.setex(this.getUserProposalKey(user2Id), 60, proposalId);
    
    return proposalId;
  }
  
  // Get match proposal by ID
  async getMatchProposal(proposalId) {
    const proposalKey = this.getMatchProposalKey(proposalId);
    const proposal = await this.redis.hgetall(proposalKey);
    
    if (!proposal.proposalId) {
      return null;
    }
    
    return {
      ...proposal,
      criteria1: JSON.parse(proposal.criteria1),
      criteria2: JSON.parse(proposal.criteria2),
      sessionCriteria: JSON.parse(proposal.sessionCriteria),
      createdAt: parseInt(proposal.createdAt),
      user1Accepted: proposal.user1Accepted === 'true',
      user2Accepted: proposal.user2Accepted === 'true'
    };
  }
  
  async getUserActiveProposal(userId) {
    const proposalId = await this.redis.get(this.getUserProposalKey(userId));
    if (!proposalId) {
      return null;
    }
    return await this.getMatchProposal(proposalId);
  }
  
  async acceptMatchProposal(userId, proposalId) {
    const proposalKey = this.getMatchProposalKey(proposalId);
    const proposal = await this.getMatchProposal(proposalId);
    
    if (!proposal) {
      return { success: false, error: 'Proposal not found or expired' };
    }
    
    if (proposal.status !== 'pending') {
      return { success: false, error: 'Proposal is no longer pending' };
    }
    
    // Mark user as accepted
    if (userId === proposal.user1Id) {
      await this.redis.hset(proposalKey, 'user1Accepted', 'true');
      proposal.user1Accepted = true;
    } else if (userId === proposal.user2Id) {
      await this.redis.hset(proposalKey, 'user2Accepted', 'true');
      proposal.user2Accepted = true;
    } else {
      return { success: false, error: 'User not part of this proposal' };
    }
    
    // Check if both users accepted
    if (proposal.user1Accepted && proposal.user2Accepted) {
      await this.redis.hset(proposalKey, 'status', 'accepted');
      return { success: true, bothAccepted: true, proposal };
    }
    
    return { success: true, bothAccepted: false, proposal };
  }
  
  // Decline a match proposal
  async declineMatchProposal(userId, proposalId) {
    const proposalKey = this.getMatchProposalKey(proposalId);
    const proposal = await this.getMatchProposal(proposalId);
    
    if (!proposal) {
      return { success: false, error: 'Proposal not found or expired' };
    }
    
    if (proposal.status !== 'pending') {
      return { success: false, error: 'Proposal is no longer pending' };
    }
    
    await this.redis.hset(proposalKey, 'status', 'declined');
    await this.redis.hset(proposalKey, 'declinedBy', userId);
    
    return { success: true, proposal };
  }
  
  async cleanupMatchProposal(proposalId, user1Id, user2Id) {
    const proposalKey = this.getMatchProposalKey(proposalId);
    await this.redis.del(proposalKey);
    await this.redis.del(this.getUserProposalKey(user1Id));
    await this.redis.del(this.getUserProposalKey(user2Id));
  }
  
  async cleanupExpiredRequests() {
    const topics = [
      'binary-search', 'linked-list', 'stack', 'graph', 
      'sorting', 'tree', 'dynamic-programming', 'greedy',
      'arrays', 'strings', 'hash-table', 'two-pointers'
    ];
    
    const expiredThreshold = Date.now() - (30 * 1000);
    let totalCleaned = 0;
    
    for (const topic of topics) {
      const queueKey = this.getQueueKey(topic);
      
      const removed = await this.redis.zremrangebyscore(queueKey, 0, expiredThreshold);
      totalCleaned += removed;
    }
    
    console.log(` Cleaned up ${totalCleaned} expired queue entries`);
    return totalCleaned;
  }
  
  async disconnect() {
    await this.redis.disconnect();
    await this.subscriber.disconnect();
  }
}

export default new RedisService();