import { Router } from "express";
import { requireAuthentication } from "../middleware/authentication.js";
import { listRecommendations } from "../controllers/recommendation-controller.js";

export const recommendationRoutes = Router();
recommendationRoutes.use(requireAuthentication);
recommendationRoutes.get("/jobs", listRecommendations);
