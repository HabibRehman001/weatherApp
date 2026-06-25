/**
 * Shared TypeScript types for weather data flowing through the app.
 * Shapes match the Open-Meteo geocoding and forecast API responses.
 */

/** Result from Open-Meteo geocoding — one matched city with coordinates. */
export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

/** Current weather snapshot at a single timestamp. */
export interface WeatherCurrent {
  time: string;
  temperature_2m: number;
  wind_speed_10m: number;
}

/** Hourly forecast series — each array index corresponds to the same hour. */
export interface WeatherHourly {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  wind_speed_10m: number[];
}

/** Full forecast response from Open-Meteo stored in MongoDB and returned to clients. */
export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: WeatherCurrent;
  hourly: WeatherHourly;
}

/** A cached weather record as stored/retrieved from the database. */
export interface WeatherRecord {
  id: string;
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  weather: OpenMeteoResponse;
  fetchedAt: string;
}

/** Response sent to the client after a weather search (includes cache vs live source). */
export interface WeatherSearchResponse {
  source: "cache" | "api";
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  weather: OpenMeteoResponse;
  fetchedAt: string;
}

/** Lightweight city match returned while the user is typing in the search box. */
export interface CitySuggestion {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}
