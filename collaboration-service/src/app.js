import { setupWSConnection } from "@y/websocket-server/utils";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", setupWSConnection);

const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
