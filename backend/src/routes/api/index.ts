/**
 * Root API router — mounts all /api/* sub-routes.
 * Routes only wire paths to controllers; no business logic here.
 */
import { Router } from "express";
import { health } from "../../controllers/healthController.js";
import weatherRoutes from "./weather.js";

const apiRouter = Router();

apiRouter.get("/health", health);
apiRouter.use("/weather", weatherRoutes);

export default apiRouter;
