import "dotenv/config";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { connectDatabase } from "./config/db.js";
import { createApp } from "./app.js";
import { attachAiQueueEvents } from "./services/ai-queue.js";

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("Set a JWT_SECRET of at least 32 characters");
  await connectDatabase();
  const app = createApp();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",") }
  });
  io.use((socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      if (typeof payload.sub !== "string" || !payload.sub) throw new Error("Invalid token subject");
      socket.data.userId = payload.sub;
      next();
    } catch { next(new Error("Authentication required")); }
  });
  io.on("connection", (socket) => socket.join(`user:${socket.data.userId}`));
  app.set("io", io);
  attachAiQueueEvents(io);
  httpServer.listen(Number(process.env.PORT || 4000), "0.0.0.0", () => console.info(`API listening on port ${process.env.PORT || 4000}`));
}

start().catch((error) => { console.error(error); process.exit(1); });
