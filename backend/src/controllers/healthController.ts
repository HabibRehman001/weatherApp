import type { Request, Response } from "express";

/**
 * Health-check endpoint handler.
 * Confirms the API process is running; used by monitors and load balancers.
 */
export function health(_req: Request, res: Response): void {
  res.json({ status: "ok", service: "weather-api" });
}
