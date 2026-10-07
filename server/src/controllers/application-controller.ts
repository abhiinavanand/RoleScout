import type { RequestHandler } from "express";
import { prisma } from "../config/database.js";
import { ApplicationRepository } from "../repositories/application-repository.js";
import { JobRepository } from "../repositories/job-repository.js";
import { ApplicationService } from "../services/application-service.js";
import { applicationIdSchema, applicationListSchema, createApplicationSchema, updateApplicationSchema } from "../types/applications.js";
import { AppError } from "../utils/errors.js";

const service = new ApplicationService(new ApplicationRepository(prisma), new JobRepository(prisma));
const date = (value: string | null | undefined): Date | null | undefined => value === undefined ? undefined : value === null ? null : new Date(value);

export const createApplication: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const input = createApplicationSchema.parse(request.body);
    const application = await service.create(request.user.id, { ...input, appliedAt: date(input.appliedAt) });
    response.status(201).json({ success: true, data: { application } });
  } catch (error) { next(error); }
};

export const listApplications: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const filters = applicationListSchema.parse(request.query);
    response.json({ success: true, data: await service.list(request.user.id, filters) });
  } catch (error) { next(error); }
};

export const getApplication: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const { id } = applicationIdSchema.parse(request.params);
    response.json({ success: true, data: { application: await service.get(request.user.id, id) } });
  } catch (error) { next(error); }
};

export const updateApplication: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const { id } = applicationIdSchema.parse(request.params);
    const input = updateApplicationSchema.parse(request.body);
    response.json({ success: true, data: { application: await service.update(request.user.id, id, { ...input, appliedAt: date(input.appliedAt) }) } });
  } catch (error) { next(error); }
};

export const deleteApplication: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const { id } = applicationIdSchema.parse(request.params);
    await service.delete(request.user.id, id);
    response.json({ success: true, data: { deleted: true } });
  } catch (error) { next(error); }
};
