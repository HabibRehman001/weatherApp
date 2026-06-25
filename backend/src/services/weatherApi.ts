import type {
  CitySuggestion,
  GeocodingResult,
  OpenMeteoResponse,
} from "../types/weather.js";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/**
 * Converts a city name string into coordinates via Open-Meteo's geocoding API.
 * Returns the top match (count=1) or null if no city is found for the query.
 */
export async function geocodeCity(
  query: string
): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({
    name: query.trim(),
    count: "1",
    language: "en",
    format: "json",
  });

  const res = await fetch(`${GEOCODING_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`Geocoding failed: ${res.status}`);
  }

  const data = (await res.json()) as { results?: GeocodingResult[] };
  return data.results?.[0] ?? null;
}

/**
 * Returns multiple city matches for autocomplete as the user types.
 * Uses Open-Meteo geocoding with a higher count limit (default 8).
 */
export async function geocodeCitySuggestions(
  query: string,
  count = 8
): Promise<CitySuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    name: trimmed,
    count: String(count),
    language: "en",
    format: "json",
  });

  const res = await fetch(`${GEOCODING_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`Geocoding failed: ${res.status}`);
  }

  const data = (await res.json()) as { results?: GeocodingResult[] };
  return (data.results ?? []).map((r) => ({
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

/**
 * Fetches live weather from Open-Meteo for the given lat/lon.
 * Requests current temp/wind plus hourly temp, humidity, and wind arrays.
 */
export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<OpenMeteoResponse> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,wind_speed_10m",
    hourly: "temperature_2m,relative_humidity_2m,wind_speed_10m",
    timezone: "auto",
  });

  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`Weather fetch failed: ${res.status}`);
  }

  return res.json() as Promise<OpenMeteoResponse>;
}
