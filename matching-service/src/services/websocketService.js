import { Server } from 'socket.io';
import redisService from './redisService.js';

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }
  
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    
    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupRedisSubscription();
    
    console.log(' WebSocket service initialized');
  }
  
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }
        
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
        
        const verifyResponse = await fetch(`${userServiceUrl}/auth/verify-token`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json().catch(() => ({}));
          return next(new Error(`Authentication error: ${errorData.message || 'Token verification failed'}`));
        }
        
        const verifyResult = await verifyResponse.json();
        
        socket.user = {
          userId: verifyResult.user.id,
          username: verifyResult.user.username,
          email: verifyResult.user.email,
          isAdmin: verifyResult.user.isAdmin || false
        };
        
        next();
      } catch (err) {
        console.error('WebSocket auth error:', err);
        
        if (err.code === 'ECONNREFUSED' || err.name === 'FetchError') {
          next(new Error('Authentication error: User service unavailable'));
        } else {
          next(new Error('Authentication error: Token verification failed'));
        }
      }
    });
  }
  
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.user.userId;
      
      console.log(` User ${socket.user.username} (${userId}) connected via WebSocket`);
      
      this.connectedUsers.set(userId, socket);
      
      socket.join(`user:${userId}`);
      
      this.handleClientEvents(socket);
      
      socket.on('disconnect', () => {
        console.log(` User ${socket.user.username} (${userId}) disconnected`);
        this.connectedUsers.delete(userId);
      });
    });
  }
  
  handleClientEvents(socket) {
    const userId = socket.user.userId;
    
    socket.on('join_matching_queue', (data) => {
      console.log(` User ${userId} joining matching queue:`, data);
      
      socket.emit('queue_joined', {
        type: 'queue_joined',
        message: 'Successfully joined matching queue',
        criteria: data
      });
    });
    
    socket.on('leave_matching_queue', () => {
      console.log(` User ${userId} leaving matching queue`);
      
      socket.emit('queue_left', {
        type: 'queue_left',
        message: 'Left matching queue'
      });
    });
    
    // Client accepts match
    socket.on('accept_match', (data) => {
      console.log(` User ${userId} accepted match:`, data);
      
      const partnerId = data.partnerId;
      this.notifyUser(partnerId, {
        type: 'match_accepted',
        acceptedBy: userId,
        sessionId: data.sessionId
      });
      
      socket.emit('match_acceptance_sent', {
        type: 'match_acceptance_sent',
        message: 'Match acceptance sent to partner'
      });
    });
    
    // Client declines match
    socket.on('decline_match', (data) => {
      console.log(` User ${userId} declined match:`, data);
      
      const partnerId = data.partnerId;
      this.notifyUser(partnerId, {
        type: 'match_declined',
        declinedBy: userId,
        sessionId: data.sessionId
      });
      
      socket.emit('match_declined_sent', {
        type: 'match_declined_sent',
        message: 'Match declined, returning to queue'
      });
    });
    
    // Client requests queue status
    socket.on('get_queue_status', async () => {
      try {
        const stats = await redisService.getQueueStats();
        socket.emit('queue_status', {
          type: 'queue_status',
          stats
        });
      } catch (err) {
        console.error('Error getting queue status:', err);
        socket.emit('error', {
          type: 'error',
          message: 'Failed to get queue status'
        });
      }
    });
  }
  
  setupRedisSubscription() {
    redisService.subscriber.psubscribe('matching:notifications:*');
    
    redisService.subscriber.on('pmessage', (pattern, channel, message) => {
      try {
        const userId = channel.split(':')[2];
        const notification = JSON.parse(message);
        
        console.log(` Sending notification to user ${userId}:`, notification.type);
        
        this.notifyUser(userId, notification);
        
      } catch (err) {
        console.error('Redis notification error:', err);
      }
    });
  }
  
  notifyUser(userId, notification) {
    const socket = this.connectedUsers.get(userId);
    
    if (socket && socket.connected) {
      socket.emit('notification', notification);
      console.log(`  Notification sent to user ${userId}:`, notification.type);
    } else {
      console.log(` User ${userId} not connected, notification queued`);
    }
  }
  
  broadcast(event, data) {
    this.io.emit(event, data);
  }
  
  sendToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }
  
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }
  
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }
}

export default new WebSocketService();