import { Router } from "express";
import multer from "multer";
import { requireAuthentication } from "../middleware/authentication.js";
import { deleteResume, getProfile, getResume, getResumeStatus, listResumes, reparseProfile, resumeUploadLimit, updateProfile, uploadResume } from "../controllers/resume-controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: resumeUploadLimit, files: 1 },
});

export const resumeRoutes = Router();
resumeRoutes.use(requireAuthentication);
resumeRoutes.post("/", upload.single("resume"), uploadResume);
resumeRoutes.get("/", listResumes);
resumeRoutes.get("/:id", getResume);
resumeRoutes.get("/:id/status", getResumeStatus);
resumeRoutes.delete("/:id", deleteResume);

export const profileRoutes = Router();
profileRoutes.use(requireAuthentication);
profileRoutes.get("/", getProfile);
profileRoutes.put("/", updateProfile);
profileRoutes.post("/reparse", reparseProfile);
