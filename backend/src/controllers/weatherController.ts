import type { Request, Response } from "express";
import {
  getCachedCities,
  getCitySuggestions,
  searchCachedCities,
  searchWeatherByCity,
  searchWeatherByCoords,
  WeatherNotFoundError,
} from "../services/weatherService.js";

/**
 * Handles GET /api/weather/search
 * Accepts either ?city=Name or ?lat=X&lon=Y, delegates to the service layer,
 * and maps errors to 400 (bad input), 404 (city not found), or 500.
 */
export async function searchWeather(req: Request, res: Response): Promise<void> {
  try {
    const city = req.query.city as string | undefined;
    const lat = req.query.lat as string | undefined;
    const lon = req.query.lon as string | undefined;

    if (city?.trim()) {
      const result = await searchWeatherByCity(city.trim());
      res.json(result);
      return;
    }

    if (lat && lon) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        res.status(400).json({ error: "Invalid lat/lon values" });
        return;
      }
      const result = await searchWeatherByCoords(latitude, longitude);
      res.json(result);
      return;
    }

    res.status(400).json({
      error: "Provide ?city=Berlin or ?lat=52.52&lon=13.41",
    });
  } catch (err) {
    if (err instanceof WeatherNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Failed to fetch weather" });
  }
}

/**
 * Handles GET /api/weather/suggestions?q=kar
 * Returns matching city names while the user is typing in the search input.
 */
export async function getSuggestions(req: Request, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string | undefined)?.trim() ?? "";
    if (q.length < 2) {
      res.json([]);
      return;
    }
    res.json(await getCitySuggestions(q));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load suggestions" });
  }
}

/**
 * Handles GET /api/weather/cached
 * Returns all recent cached searches, or filters by ?q=partialCityName if provided.
 */
export async function getCached(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query.q as string | undefined;
    if (q?.trim()) {
      res.json(await searchCachedCities(q.trim()));
      return;
    }
    res.json(await getCachedCities());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load cached weather" });
  }
}
