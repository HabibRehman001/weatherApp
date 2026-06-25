/**
 * Loads environment variables from `.env` and exposes them as a typed `env` object.
 * All app config should be read from here instead of `process.env` directly.
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

export const env = {
  port: Number(process.env.PORT) || 3000,
  mongodbUri:
    process.env.MONGODB_URI ?? "mongodb://localhost:27017/weatherapp",
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;

export type Env = typeof env;
