/**
 * Weather API routes — maps HTTP paths to controller handlers.
 *   GET /search       → searchWeather
 *   GET /suggestions  → getSuggestions
 *   GET /cached       → getCached
 */
import { Router } from "express";
import { getCached, getSuggestions, searchWeather } from "../../controllers/weatherController.js";

const router = Router();

router.get("/search", searchWeather);
router.get("/suggestions", getSuggestions);
router.get("/cached", getCached);

export default router;
