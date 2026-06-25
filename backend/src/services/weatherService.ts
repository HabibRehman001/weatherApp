import {
  findCachedWeather,
  listCachedCities,
  searchCachedByCity,
  upsertWeather,
} from "../db/weatherRepository.js";
import { fetchWeather, geocodeCity, geocodeCitySuggestions } from "../services/weatherApi.js";
import type { CitySuggestion, OpenMeteoResponse, WeatherSearchResponse } from "../types/weather.js";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Checks whether a cached record is still valid.
 * Returns true if fetchedAt is less than 1 hour old.
 */
function isCacheFresh(fetchedAt: Date | string): boolean {
  const age = Date.now() - new Date(fetchedAt).getTime();
  return age < CACHE_TTL_MS;
}

/**
 * Builds the standard API response shape sent to the client.
 * Normalizes fetchedAt to ISO string and tags whether data came from cache or live API.
 */
function toSearchResponse(
  city: string,
  country: string,
  latitude: number,
  longitude: number,
  weather: OpenMeteoResponse,
  fetchedAt: Date | string,
  source: "cache" | "api"
): WeatherSearchResponse {
  return {
    source,
    city,
    country,
    latitude,
    longitude,
    weather,
    fetchedAt: new Date(fetchedAt).toISOString(),
  };
}

/**
 * Main search flow by city name:
 * 1. Geocode the query to get lat/lon
 * 2. Return fresh cache if available (< 1 hour old)
 * 3. Otherwise fetch from Open-Meteo, save to MongoDB, and return
 */
export async function searchWeatherByCity(
  query: string
): Promise<WeatherSearchResponse> {
  const location = await geocodeCity(query);
  if (!location) {
    throw new WeatherNotFoundError(`No city found for "${query}"`);
  }

  const cached = await findCachedWeather(location.name, location.country);
  if (cached && isCacheFresh(cached.fetchedAt)) {
    return toSearchResponse(
      cached.cityName,
      cached.country,
      cached.latitude,
      cached.longitude,
      cached.weather,
      cached.fetchedAt,
      "cache"
    );
  }

  const weather = await fetchWeather(location.latitude, location.longitude);
  const saved = await upsertWeather(
    location.name,
    location.country,
    location.latitude,
    location.longitude,
    weather
  );

  return toSearchResponse(
    location.name,
    location.country,
    location.latitude,
    location.longitude,
    weather,
    saved.fetchedAt,
    "api"
  );
}

/**
 * Fetches weather directly by coordinates (skips geocoding).
 * Stores under a "lat, lon" label with country "coords" in the cache.
 */
export async function searchWeatherByCoords(
  latitude: number,
  longitude: number
): Promise<WeatherSearchResponse> {
  const weather = await fetchWeather(latitude, longitude);
  const cityLabel = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

  const saved = await upsertWeather(
    cityLabel,
    "coords",
    latitude,
    longitude,
    weather
  );

  return toSearchResponse(
    cityLabel,
    "coords",
    latitude,
    longitude,
    weather,
    saved.fetchedAt,
    "api"
  );
}

/**
 * Returns a summary list of all cached searches (no full weather payload).
 * Used for "recent searches" UI — maps MongoDB docs to a lighter client shape.
 */
export async function getCachedCities() {
  const rows = await listCachedCities();
  return rows.map((row) => ({
    id: row._id.toString(),
    city: row.cityName,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    fetchedAt: new Date(row.fetchedAt).toISOString(),
  }));
}

/**
 * Filters cached records by partial city name and includes full weather data.
 * Returns up to 10 matches, newest first.
 */
export async function searchCachedCities(query: string) {
  const rows = await searchCachedByCity(query);
  return rows.map((row) => ({
    id: row._id.toString(),
    city: row.cityName,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    weather: row.weather,
    fetchedAt: new Date(row.fetchedAt).toISOString(),
  }));
}

/** Thrown when geocoding finds no matching city for the user's search query. */
export class WeatherNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherNotFoundError";
  }
}

/**
 * Returns city name suggestions for the autocomplete dropdown.
 * Delegates to Open-Meteo geocoding; requires at least 2 characters.
 */
export async function getCitySuggestions(query: string): Promise<CitySuggestion[]> {
  return geocodeCitySuggestions(query);
}
