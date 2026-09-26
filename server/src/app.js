import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import applicationRoutes from "./routes/applications.js";
import aiRoutes from "./routes/ai.js";
import analyticsRoutes from "./routes/analytics.js";
import uploadRoutes from "./routes/upload.js";
import { notFound, errorHandler } from "./middleware/errors.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(","), credentials: false }));
  app.use(express.json({ limit: "100kb" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/applications", applicationRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/ai", aiRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
