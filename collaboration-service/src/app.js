import { docs, setupWSConnection } from "@y/websocket-server/utils";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import collaborationRoutes from "./routes/collaboration.js";

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

app.use("/collaboration", collaborationRoutes);

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  const docName = req.url.replace("/", "");
  setupWSConnection(ws, req, { docName, gc: true });

  const doc = docs.get(docName);
  if (doc) {
    doc.lastAccess = Date.now();
    ws.on("message", () => {
      doc.lastAccess = Date.now();
    });
  }
});

// Delete documents of stale/finished sessions
setInterval(() => {
  const now = Date.now();
  docs.forEach((doc, name) => {
    if (now - doc.lastAccess >= 15 * 60 * 1000) {
      doc.destroy();
      docs.delete(name);
      console.log(`Deleted document for session ${name}`);
    }
  });
}, 30 * 60 * 1000);

const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
