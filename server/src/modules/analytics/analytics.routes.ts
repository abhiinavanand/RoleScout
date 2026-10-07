import { Router } from "express";
import { requireAuthentication } from "../../middleware/authentication.js";
import { getAnalyticsOverview } from "./analytics.controller.js";

export const analyticsRoutes = Router();
analyticsRoutes.use(requireAuthentication);
analyticsRoutes.get("/overview", getAnalyticsOverview);
