import { Router } from "express";
import { requireAuthentication } from "../middleware/authentication.js";
import { listSavedJobs, saveJob, unsaveJob } from "../controllers/saved-job-controller.js";

export const savedJobRoutes = Router();
savedJobRoutes.use(requireAuthentication);
savedJobRoutes.get("/", listSavedJobs);
savedJobRoutes.post("/:id", saveJob);
savedJobRoutes.delete("/:id", unsaveJob);
