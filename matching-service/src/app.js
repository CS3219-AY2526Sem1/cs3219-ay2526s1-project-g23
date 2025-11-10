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

// CORS setup
const allowedOrigins = [
  'http://localhost:5173', 
  process.env.FRONTEND_URL // dynamic URL from deployment
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS policy does not allow this origin'), false);
  },
  methods: ['GET','POST','PUT','DELETE','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'matching-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/matching', matchingRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI_MATCHING || 'mongodb://localhost:27017/peerprep-matching';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    mongoose.connection.on('error', err => console.error('MongoDB error:', err));
    mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
  }
}

// Initialize Redis
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
    console.error('Failed to connect to Redis:', err);
    console.log('Continuing without Redis - some features may not work');
  }
}

// Graceful shutdown
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}, starting graceful shutdown...`);
    server.close(async () => {
      console.log('HTTP server closed');
      try {
        await mongoose.connection.close();
        await redisService.disconnect();
        console.log('Graceful shutdown complete');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });
    setTimeout(() => {
      console.log('Force shutdown');
      process.exit(1);
    }, 10000);
  };

  ['SIGTERM','SIGINT','SIGUSR2'].forEach(sig => process.on(sig, () => shutdown(sig)));

  process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

// --- Start server ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Matching Service listening on port ${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);

  // Initialize services asynchronously after listening
  connectToDatabase().catch(err => console.error(err));
  initializeRedis().catch(err => console.error(err));
  websocketService.initialize(server);
  setupGracefulShutdown();
});
