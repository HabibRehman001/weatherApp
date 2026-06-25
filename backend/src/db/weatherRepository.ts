import { WeatherCache, type WeatherCacheDoc } from "../models/WeatherCache.js";
import type { OpenMeteoResponse } from "../types/weather.js";

/**
 * Looks up a cached weather document by city and country.
 * Uses lowercase fields for case-insensitive matching (e.g. "berlin" matches "Berlin").
 */
export async function findCachedWeather(
  cityName: string,
  country: string
): Promise<WeatherCacheDoc | null> {
  return WeatherCache.findOne({
    cityNameLower: cityName.toLowerCase(),
    countryLower: country.toLowerCase(),
  }).lean<WeatherCacheDoc>();
}

/**
 * Saves or updates weather for a city in MongoDB.
 * Matches on cityNameLower + countryLower; if a record exists it updates
 * coordinates, weather payload, and fetchedAt, otherwise creates a new doc.
 */
export async function upsertWeather(
  cityName: string,
  country: string,
  latitude: number,
  longitude: number,
  weather: OpenMeteoResponse
): Promise<WeatherCacheDoc> {
  const doc = await WeatherCache.findOneAndUpdate(
    {
      cityNameLower: cityName.toLowerCase(),
      countryLower: country.toLowerCase(),
    },
    {
      cityName,
      country,
      cityNameLower: cityName.toLowerCase(),
      countryLower: country.toLowerCase(),
      latitude,
      longitude,
      weather,
      fetchedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean<WeatherCacheDoc>();

  if (!doc) {
    throw new Error("Failed to save weather cache");
  }
  return doc;
}

/**
 * Returns all cached cities, newest searches first (sorted by fetchedAt desc).
 */
export async function listCachedCities(): Promise<WeatherCacheDoc[]> {
  return WeatherCache.find().sort({ fetchedAt: -1 }).lean<WeatherCacheDoc[]>();
}

/**
 * Partial city-name search against cached records.
 * Case-insensitive regex on cityNameLower; returns up to 10 most recent matches.
 */
export async function searchCachedByCity(
  query: string
): Promise<WeatherCacheDoc[]> {
  const pattern = query.toLowerCase();
  return WeatherCache.find({
    cityNameLower: { $regex: pattern, $options: "i" },
  })
    .sort({ fetchedAt: -1 })
    .limit(10)
    .lean<WeatherCacheDoc[]>();
}
