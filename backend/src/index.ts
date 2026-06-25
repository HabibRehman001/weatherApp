import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.config.js";
import { connectDb } from "./db/connection.js";
import apiRouter from "./routes/api/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "..", "public");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRouter);

app.use(express.static(PUBLIC_DIR));

/** SPA fallback — serve Angular index.html for non-API routes */
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

/**
 * Boots the application: connects to MongoDB first, then starts the HTTP server.
 * DB must be ready before accepting requests that read/write cached weather data.
 */
async function start() {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`Weather API running at http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
