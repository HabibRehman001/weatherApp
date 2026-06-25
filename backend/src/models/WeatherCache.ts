/**
 * Mongoose model for cached weather data stored in MongoDB.
 * Mirrors the Open-Meteo API response shape and indexes city+country for fast lookups.
 */
import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { OpenMeteoResponse } from "../types/weather.js";

/** Snapshot of current conditions (temp, wind) at one point in time. */
const weatherCurrentSchema = new Schema(
  {
    time: { type: String, required: true },
    temperature_2m: { type: Number, required: true },
    wind_speed_10m: { type: Number, required: true },
  },
  { _id: false }
);

/** Hourly forecast arrays aligned by index (time[i] → temp[i], humidity[i], etc.). */
const weatherHourlySchema = new Schema(
  {
    time: { type: [String], required: true },
    temperature_2m: { type: [Number], required: true },
    relative_humidity_2m: { type: [Number], required: true },
    wind_speed_10m: { type: [Number], required: true },
  },
  { _id: false }
);

/** Full Open-Meteo forecast payload embedded inside each cache document. */
const openMeteoSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timezone: { type: String, required: true },
    current: { type: weatherCurrentSchema, required: true },
    hourly: { type: weatherHourlySchema, required: true },
  },
  { _id: false }
);

const weatherCacheSchema = new Schema(
  {
    cityName: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    cityNameLower: { type: String, required: true, lowercase: true },
    countryLower: { type: String, required: true, lowercase: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    weather: { type: openMeteoSchema, required: true },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

weatherCacheSchema.index(
  { cityNameLower: 1, countryLower: 1 },
  { unique: true }
);
weatherCacheSchema.index({ cityNameLower: 1 });
weatherCacheSchema.index({ fetchedAt: -1 });

export type WeatherCacheDoc = InferSchemaType<typeof weatherCacheSchema> & {
  _id: mongoose.Types.ObjectId;
  weather: OpenMeteoResponse;
};

export const WeatherCache = mongoose.model("WeatherCache", weatherCacheSchema);
