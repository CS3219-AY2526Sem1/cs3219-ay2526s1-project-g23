import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";

// Directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
app.use(express.json());

const REGION = process.env.REGION || 'asia-southeast1';

// Service names
const FRONTEND_SERVICE = process.env.FRONTEND_SERVICE || 'peerprep-frontend-6619362751';
const USER_SERVICE = process.env.USER_SERVICE || 'user-service-6619362751';
const QUESTION_SERVICE = process.env.QUESTION_SERVICE || 'question-service-6619362751';
const MATCHING_SERVICE = process.env.MATCHING_SERVICE || 'matching-service-6619362751';

// Dynamic URLs
const USER_SERVICE_URL = `https://${USER_SERVICE}.${REGION}.run.app`;
const QUESTION_SERVICE_URL = `https://${QUESTION_SERVICE}.${REGION}.run.app`;
const MATCHING_SERVICE_URL = `https://${MATCHING_SERVICE}.${REGION}.run.app`;
const FRONTEND_URL = `https://${FRONTEND_SERVICE}.${REGION}.run.app`;

// CORS
const allowedOrigins = ['http://localhost:5173'];
const servicePrefixes = [
  'https://peerprep-frontend',
  'https://user-service',
  'https://question-service',
  'https://matching-service'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    for (const prefix of servicePrefixes) {
      if (origin.startsWith(prefix)) return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from: ${origin}`), false);
  },
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// Export app & services (ES modules)
export { app, USER_SERVICE_URL, QUESTION_SERVICE_URL, MATCHING_SERVICE_URL, FRONTEND_URL };

// MongoDB + start server
const PORT = process.env.PORT || 3001;
mongoose.connect(process.env.MONGO_URI_USER)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
