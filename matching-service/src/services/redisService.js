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
    
    // Separate connection for pub/sub
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
  
  // Generate queue key based on topic
  getQueueKey(topic) {
    return `matching:queue:${topic}`;
  }
  
  // Generate active request key for user
  getActiveRequestKey(userId) {
    return `matching:active:${userId}`;
  }
  
  // Generate notification channel for user
  getNotificationChannel(userId) {
    return `matching:notifications:${userId}`;
  }
  
  async addToQueue(userId, topic, proficiency, difficulty, language = 'javascript') {
    const queueKey = this.getQueueKey(topic);
    const activeKey = this.getActiveRequestKey(userId);
    const timestamp = Date.now();
    
    // Store user's request data with TTL (5 minutes)
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
    
    // Add to topic queue (sorted set with timestamp as score)
    pipeline.zadd(queueKey, timestamp, userId);
    
    // Store active request data with expiration
    pipeline.hmset(activeKey, requestData);
    pipeline.expire(activeKey, 300); // 5 minutes TTL
    
    // Update queue statistics
    pipeline.hincrby('matching:stats', 'totalActive', 1);
    pipeline.hincrby('matching:stats', `topic:${topic}`, 1);
    
    await pipeline.exec();
    
    // Get queue position
    const position = await this.getQueuePosition(userId, topic);
    return { position, timestamp };
  }
  
  // Remove user from queue
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
  
  // Clean up expired requests
  async cleanupExpiredRequests() {
    const topics = [
      'binary-search', 'linked-list', 'stack', 'graph', 
      'sorting', 'tree', 'dynamic-programming', 'greedy',
      'arrays', 'strings', 'hash-table', 'two-pointers'
    ];
    
    const expiredThreshold = Date.now() - (5 * 60 * 1000);
    let totalCleaned = 0;
    
    for (const topic of topics) {
      const queueKey = this.getQueueKey(topic);
      
      // Remove entries older than threshold
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