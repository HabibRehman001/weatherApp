export interface CitySuggestion {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherCurrent {
  time: string;
  temperature_2m: number;
  wind_speed_10m: number;
}

export interface WeatherHourly {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  wind_speed_10m: number[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: WeatherCurrent;
  hourly: WeatherHourly;
}

export interface WeatherSearchResponse {
  source: 'cache' | 'api';
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  weather: OpenMeteoResponse;
  fetchedAt: string;
}

export interface CachedCity {
  id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  fetchedAt: string;
}
