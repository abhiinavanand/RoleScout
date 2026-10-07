import type { RequestHandler } from "express";
import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/errors.js";
import { analyticsRangeSchema } from "./analytics.types.js";
import { AnalyticsRepository } from "./analytics.repository.js";
import { AnalyticsService } from "./analytics.service.js";

const service = new AnalyticsService(new AnalyticsRepository(prisma));

export const getAnalyticsOverview: RequestHandler = async (request, response, next) => {
  try {
    if (!request.user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    const range = analyticsRangeSchema.parse(request.query.range);
    response.json({ success: true, data: await service.overview(request.user.id, range) });
  } catch (error) {
    next(error);
  }
};
