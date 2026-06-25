import mongoose from "mongoose";
import { env } from "../config/env.config.js";

/**
 * Opens a MongoDB connection using the URI from env config.
 * Skips if already connected (readyState 1). Logs and rethrows on failure
 * so the caller can stop the server from starting with a broken DB.
 */
export async function connectDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(env.mongodbUri);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err;
  }
}
