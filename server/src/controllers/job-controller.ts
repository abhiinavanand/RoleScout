import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { JobRepository } from "../repositories/job-repository.js";
import { SerpApiJobSearchProvider } from "../providers/job-search/serpapi-provider.js";
import { JobSearchService } from "../services/job-search-service.js";
import { jobSearchSchema, persistedJobFiltersSchema } from "../types/jobs.js";
import { enqueueJobDiscovery } from "../jobs/job-discovery-jobs.js";
import { MatchingService } from "../modules/matching/matching.service.js";
import { ResumeRepository } from "../repositories/resume-repository.js";

const repository = new JobRepository(prisma);
const searchService = new JobSearchService(repository, new SerpApiJobSearchProvider());
const matchingService = new MatchingService(new ResumeRepository(prisma), repository);
const idSchema = z.object({ id: z.string().min(1).max(100) });

function publicJob(job: {
  id: string; externalId: string; source: string; title: string; companyName: string; companyUrl: string | null; jobUrl: string;
  location: string | null; employmentType: string | null; workplaceType: string | null; description: string;
  salaryMin: number | null; salaryMax: number | null; salaryCurrency: string | null; salaryPeriod: string | null;
  postedAt: Date | null; expiresAt: Date | null; sourceUrl: string | null; createdAt: Date; updatedAt: Date;
}) {
  return job;
}

export const searchJobs: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const input = jobSearchSchema.parse(request.body);
    const search = await searchService.createPendingSearch(request.user.id, input);
    const queueJob = await enqueueJobDiscovery({ searchId: search.id });
    response.status(202).json({ success: true, data: { searchId: search.id, processingStatus: search.processingStatus, jobId: queueJob.id } });
  } catch (error) {
    next(error);
  }
};

export const getSearchStatus: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const { id } = idSchema.parse(request.params);
    const search = await repository.findSearchForUser(id, request.user.id);
    if (!search) throw new AppError(404, "SEARCH_NOT_FOUND", "Search history entry not found.");
    response.json({ success: true, data: { id: search.id, processingStatus: search.processingStatus, processingErrorCode: search.processingErrorCode } });
  } catch (error) {
    next(error);
  }
};

export const listJobs: RequestHandler = async (request, response, next) => {
  try {
    const filters = persistedJobFiltersSchema.parse(request.query);
    const result = await repository.findMany(filters);
    response.json({ success: true, data: { jobs: result.jobs.map(publicJob), pagination: { page: filters.page, limit: filters.limit, total: result.total, hasNextPage: filters.page * filters.limit < result.total } } });
  } catch (error) {
    next(error);
  }
};

export const getJob: RequestHandler = async (request, response, next) => {
  try {
    const { id } = idSchema.parse(request.params);
    const job = await repository.findById(id);
    if (!job) throw new AppError(404, "JOB_NOT_FOUND", "Job not found.");
    response.json({ success: true, data: { job: publicJob(job) } });
  } catch (error) {
    next(error);
  }
};

export const getJobMatch: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const { id } = idSchema.parse(request.params);
    const match = await matchingService.matchJob(request.user.id, id);
    response.json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

export const listSearches: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const searches = await repository.listSearches(request.user.id);
    response.json({ success: true, data: { searches } });
  } catch (error) {
    next(error);
  }
};

export const deleteSearch: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const { id } = idSchema.parse(request.params);
    const deleted = await repository.deleteSearch(id, request.user.id);
    if (!deleted) throw new AppError(404, "SEARCH_NOT_FOUND", "Search history entry not found.");
    response.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};
