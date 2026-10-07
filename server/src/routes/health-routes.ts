import { Router } from "express";
import { getHealth, getReadiness } from "../controllers/health-controller.js";

export const healthRoutes = Router();
healthRoutes.get("/", getHealth);
healthRoutes.get("/ready", getReadiness);
