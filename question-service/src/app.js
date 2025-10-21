import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import questionRoutes from "./routes/questions.js";
import attemptRoutes from './routes/attempts.js';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

// Connect to MongoDB
mongoose
  .connect(process.env.DB_CLOUD_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/questions", questionRoutes);
app.use('/attempts', attemptRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
