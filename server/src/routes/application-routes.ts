import { Router } from "express";
import { requireAuthentication } from "../middleware/authentication.js";
import { createApplication, deleteApplication, getApplication, listApplications, updateApplication } from "../controllers/application-controller.js";

export const applicationRoutes = Router();
applicationRoutes.use(requireAuthentication);
applicationRoutes.post("/", createApplication);
applicationRoutes.get("/", listApplications);
applicationRoutes.get("/:id", getApplication);
applicationRoutes.patch("/:id", updateApplication);
applicationRoutes.delete("/:id", deleteApplication);
