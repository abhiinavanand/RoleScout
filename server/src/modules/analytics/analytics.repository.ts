import type { PrismaClient } from "@prisma/client";
import type { AnalyticsDateRange } from "./analytics.types.js";

export class AnalyticsRepository {
  constructor(private readonly database: PrismaClient) {}

  async countApplications(userId: string, range: AnalyticsDateRange): Promise<number> {
    return this.database.application.count({ where: { userId, createdAt: this.dateFilter(range) } });
  }

  async countByStatus(userId: string, range: AnalyticsDateRange) {
    return this.database.application.groupBy({ by: ["status"], where: { userId, createdAt: this.dateFilter(range) }, _count: { _all: true } });
  }

  countSavedJobs(userId: string, range: AnalyticsDateRange): Promise<number> {
    return this.database.savedJob.count({ where: { userId, createdAt: this.dateFilter(range) } });
  }

  countSearches(userId: string, range: AnalyticsDateRange): Promise<number> {
    return this.database.jobSearch.count({ where: { userId, createdAt: this.dateFilter(range) } });
  }

  async applicationsPerDay(userId: string, range: AnalyticsDateRange): Promise<Array<{ date: Date; count: bigint }>> {
    return this.database.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE_TRUNC('day', "createdAt") AS date, COUNT(*)::bigint AS count
      FROM "Application"
      WHERE "userId" = ${userId}
        AND (${range.from}::timestamp IS NULL OR "createdAt" >= ${range.from})
        AND "createdAt" < ${range.to}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;
  }

  private dateFilter(range: AnalyticsDateRange) {
    return range.from ? { gte: range.from, lt: range.to } : { lt: range.to };
  }
}
