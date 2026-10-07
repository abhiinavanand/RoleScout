import { Router } from "express";
import { requireAuthentication } from "../middleware/authentication.js";
import { deleteSearch, getJob, getJobMatch, getSearchStatus, listJobs, listSearches, searchJobs } from "../controllers/job-controller.js";

export const jobRoutes = Router();
jobRoutes.use(requireAuthentication);
jobRoutes.post("/search", searchJobs);
jobRoutes.get("/", listJobs);
jobRoutes.get("/:id/match", getJobMatch);
jobRoutes.get("/:id", getJob);

export const searchRoutes = Router();
searchRoutes.use(requireAuthentication);
searchRoutes.get("/", listSearches);
searchRoutes.get("/:id/status", getSearchStatus);
searchRoutes.delete("/:id", deleteSearch);
