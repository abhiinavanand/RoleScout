import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../config/database.js";
import { JobRepository } from "../repositories/job-repository.js";
import { SavedJobRepository } from "../repositories/saved-job-repository.js";
import { AppError } from "../utils/errors.js";

const idSchema = z.object({ id: z.string().trim().min(1).max(100) });
const repository = new SavedJobRepository(prisma);
const jobs = new JobRepository(prisma);

export const listSavedJobs: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    response.json({ success: true, data: { items: await repository.listForUser(request.user.id) } });
  } catch (error) { next(error); }
};

export const saveJob: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const { id } = idSchema.parse(request.params);
    if (!await jobs.findById(id)) throw new AppError(404, "JOB_NOT_FOUND", "Job not found.");
    if (await repository.findForUser(request.user.id, id)) throw new AppError(409, "JOB_ALREADY_SAVED", "Job is already saved.");
    response.status(201).json({ success: true, data: { savedJob: await repository.save(request.user.id, id) } });
  } catch (error) { next(error); }
};

export const unsaveJob: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const { id } = idSchema.parse(request.params);
    const result = await repository.deleteForUser(request.user.id, id);
    if (!result.count) throw new AppError(404, "SAVED_JOB_NOT_FOUND", "Saved job not found.");
    response.json({ success: true, data: { deleted: true } });
  } catch (error) { next(error); }
};
