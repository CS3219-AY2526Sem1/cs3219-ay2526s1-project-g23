import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import questionRoutes from "./routes/questions.js";
import attemptRoutes from './routes/attempts.js';

// -------------------- ES Modules directory setup --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------- Load environment variables --------------------
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
app.use(express.json());

// -------------------- Dynamic URLs --------------------
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'https://user-service';
const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL || 'https://question-service';
const MATCHING_SERVICE_URL = process.env.MATCHING_SERVICE_URL || 'https://matching-service';

// -------------------- CORS --------------------
const allowedOrigins = ['http://localhost:5173', FRONTEND_URL];
const servicePrefixes = [FRONTEND_URL, USER_SERVICE_URL, QUESTION_SERVICE_URL, MATCHING_SERVICE_URL];

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

// -------------------- MongoDB Connection --------------------
mongoose
  .connect(process.env.MONGO_URI_QUESTION)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// -------------------- Routes --------------------
app.use("/questions", questionRoutes);
app.use("/attempts", attemptRoutes);

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Question Service running on port ${PORT}`);
});

// -------------------- Export App & URLs --------------------
export { 
  app, 
  FRONTEND_URL, 
  USER_SERVICE_URL, 
  QUESTION_SERVICE_URL, 
  MATCHING_SERVICE_URL 
};
