import { createApp } from "../server/src/app.js";
import { connectDatabase } from "../server/src/config/db.js";

const app = createApp();

export default async function handler(req, res) {
  try {
    await connectDatabase();
    return app(req, res);
  } catch (error) {
    console.error("API initialization failed", error);
    return res.status(503).json({ error: "The API is temporarily unavailable." });
  }
}
