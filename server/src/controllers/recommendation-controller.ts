import type { RequestHandler } from "express";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { RecommendationService } from "../modules/recommendations/recommendation-service.js";
import { JobRepository } from "../repositories/job-repository.js";
import { ResumeRepository } from "../repositories/resume-repository.js";
import { SavedJobRepository } from "../repositories/saved-job-repository.js";
import { ApplicationRepository } from "../repositories/application-repository.js";
import { recommendationListSchema } from "../types/recommendations.js";

const service = new RecommendationService(
  new ResumeRepository(prisma),
  new JobRepository(prisma),
  new SavedJobRepository(prisma),
  new ApplicationRepository(prisma),
);

function publicJob(job: {
  id: string; externalId: string; source: string; title: string; companyName: string; companyUrl: string | null; jobUrl: string;
  location: string | null; employmentType: string | null; workplaceType: string | null; description: string;
  salaryMin: number | null; salaryMax: number | null; salaryCurrency: string | null; salaryPeriod: string | null;
  postedAt: Date | null; expiresAt: Date | null; sourceUrl: string | null; createdAt: Date; updatedAt: Date;
}) {
  return job;
}

export const listRecommendations: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const { page, pageSize } = recommendationListSchema.parse(request.query);
    const result = await service.listForUser(request.user.id, page, pageSize);
    response.json({
      success: true,
      data: {
        recommendations: result.recommendations.map((item) => ({ job: publicJob(item.job), match: item.match, state: item.state })),
        pagination: { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages, evaluatedJobs: result.evaluatedJobs },
      },
    });
  } catch (error) {
    next(error);
  }
};
