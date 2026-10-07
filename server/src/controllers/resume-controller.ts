import type { RequestHandler } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { ResumeRepository } from "../repositories/resume-repository.js";
import { prisma } from "../config/database.js";
import { ResumeService } from "../services/resume-service.js";
import { candidateProfileSchema } from "../types/profile.js";
import { AppError } from "../utils/errors.js";
import { enqueueResumeProcessing } from "../jobs/resume-jobs.js";

const repository = new ResumeRepository(prisma);
const resumeService = new ResumeService(repository);
const idSchema = z.object({ id: z.string().min(1).max(100) });

function publicResume(resume: { id: string; originalFileName: string; mimeType: string; fileSize: number; processingStatus: string; processingErrorCode: string | null; createdAt: Date; updatedAt: Date }) {
  return { id: resume.id, originalFileName: resume.originalFileName, mimeType: resume.mimeType, fileSize: resume.fileSize, processingStatus: resume.processingStatus, processingErrorCode: resume.processingErrorCode, createdAt: resume.createdAt, updatedAt: resume.updatedAt };
}

export const uploadResume: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user || !request.file) throw new AppError(400, "RESUME_REQUIRED", "A PDF or DOCX resume is required.");
    const resume = await resumeService.uploadPending(request.user.id, request.file);
    const queueJob = await enqueueResumeProcessing({ resumeId: resume.id });
    response.status(202).json({ success: true, data: { resume: publicResume(resume), processingStatus: resume.processingStatus, jobId: queueJob.id } });
  } catch (error) {
    next(error);
  }
};

export const listResumes: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const resumes = await repository.listForUser(request.user.id);
    response.json({ success: true, data: { resumes: resumes.map(publicResume) } });
  } catch (error) {
    next(error);
  }
};

export const getResume: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const { id } = idSchema.parse(request.params);
    const resume = await repository.findForUser(id, request.user.id);
    if (!resume) throw new AppError(404, "RESUME_NOT_FOUND", "Resume not found.");
    response.json({ success: true, data: { resume: publicResume(resume) } });
  } catch (error) {
    next(error);
  }
};

export const getResumeStatus: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const { id } = idSchema.parse(request.params);
    const resume = await repository.findForUser(id, request.user.id);
    if (!resume) throw new AppError(404, "RESUME_NOT_FOUND", "Resume not found.");
    response.json({ success: true, data: { id: resume.id, processingStatus: resume.processingStatus, processingErrorCode: resume.processingErrorCode } });
  } catch (error) {
    next(error);
  }
};

export const deleteResume: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const { id } = idSchema.parse(request.params);
    await resumeService.delete(request.user.id, id);
    response.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};

export const getProfile: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const profile = await repository.getProfile(request.user.id);
    response.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
};

export const updateProfile: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const profile = candidateProfileSchema.parse(request.body);
    const savedProfile = await repository.saveProfile(request.user.id, profile);
    response.json({ success: true, data: { profile: savedProfile } });
  } catch (error) {
    next(error);
  }
};

export const reparseProfile: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const profile = await resumeService.reparse(request.user.id);
    response.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
};

export const resumeUploadLimit = env.MAX_RESUME_SIZE_BYTES;
