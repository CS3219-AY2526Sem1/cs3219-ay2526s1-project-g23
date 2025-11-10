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

// -------------------- Dynamic URLs --------------------
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'https://user-service';
const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL || 'https://question-service';
const MATCHING_SERVICE_URL = process.env.MATCHING_SERVICE_URL || 'https://matching-service';

// -------------------- CORS Setup --------------------
const allowedOrigins = [ 'http://localhost:5173', FRONTEND_URL ];
const servicePrefixes = [ FRONTEND_URL, USER_SERVICE_URL, QUESTION_SERVICE_URL, MATCHING_SERVICE_URL ];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // server-to-server
    if (allowedOrigins.includes(origin)) return callback(null, true);
    for (const prefix of servicePrefixes) {
      if (origin.startsWith(prefix)) return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from: ${origin}`), false);
  },
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

// -------------------- Middleware --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// -------------------- Health Check --------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'matching-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// -------------------- Routes --------------------
app.use('/api/matching', matchingRoutes);

// -------------------- Global Error Handling --------------------
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

// -------------------- Database --------------------
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

// -------------------- Redis --------------------
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

// -------------------- Graceful Shutdown --------------------
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

// -------------------- Start Server --------------------
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Matching Service listening on port ${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);

  // Initialize services asynchronously after server starts
  connectToDatabase().catch(err => console.error(err));
  initializeRedis().catch(err => console.error(err));
  websocketService.initialize(server);
  setupGracefulShutdown();
});

// -------------------- Export App & URLs --------------------
export { 
  app, 
  FRONTEND_URL, 
  USER_SERVICE_URL, 
  QUESTION_SERVICE_URL, 
  MATCHING_SERVICE_URL 
};
