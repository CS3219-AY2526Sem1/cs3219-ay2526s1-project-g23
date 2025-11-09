import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import redisService from './services/redisService.js';
import websocketService from './services/websocketService.js';
import matchingRoutes from './routes/matching.js';

dotenv.config();

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3003;

const allowedOrigins = [
  'http://localhost:5173', // local frontend
  'https://peerprep-frontend-6619362751.asia-southeast1.run.app' // deployed frontend
];

const corsOptions = {
  origin: function(origin, callback) {
    // allow requests with no origin (like curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'matching-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

app.use('/api/matching', matchingRoutes);

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/peerprep-matching';
    
    await mongoose.connect(mongoUri, {
    });
    
    console.log(' Connected to MongoDB successfully');
    
    mongoose.connection.on('error', (err) => {
      console.error(' MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log(' MongoDB disconnected');
    });
    
  } catch (err) {
    console.error(' Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

async function initializeRedis() {
  try {
    await redisService.redis.ping();
    console.log('Redis connection established');
    
    setInterval(async () => {
      try {
        await redisService.cleanupExpiredRequests();
      } catch (err) {
        console.error('Cleanup job error:', err);
      }
    }, 30000);
    
  } catch (err) {
    console.error(' Failed to connect to Redis:', err);
    console.log('  Continuing without Redis - some features may not work');
  }
}

function setupGracefulShutdown() {
  const gracefulShutdown = async (signal) => {
    console.log(`\n Received ${signal}, starting graceful shutdown...`);
    
    server.close(async () => {
      console.log('🔌 HTTP server closed');
      
      try {
        await mongoose.connection.close();
        console.log(' Database connection closed');
        
        await redisService.disconnect();
        console.log(' Redis connections closed');
        
        console.log(' Graceful shutdown completed');
        process.exit(0);
      } catch (err) {
        console.error(' Error during shutdown:', err);
        process.exit(1);
      }
    });
    
    setTimeout(() => {
      console.log('  Force shutdown after timeout');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
  
  process.on('uncaughtException', (err) => {
    console.error(' Uncaught Exception:', err);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

// Start server
async function startServer() {
  try {
    console.log(' Starting Matching Service...');
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    
    await connectToDatabase();
    await initializeRedis();
    
    websocketService.initialize(server);
    
    server.listen(PORT, () => {
      console.log(` Matching Service listening on port ${PORT}`);
      console.log(` WebSocket endpoint: ws://localhost:${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/health`);
      console.log(` API endpoints: http://localhost:${PORT}/api/matching/*`);
    });
    
    setupGracefulShutdown();
    
  } catch (err) {
    console.error(' Failed to start server:', err);
    process.exit(1);
  }
}

startServer();