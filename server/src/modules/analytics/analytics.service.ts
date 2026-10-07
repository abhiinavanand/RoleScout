import { AnalyticsRepository } from "./analytics.repository.js";
import { ANALYTICS_STATUSES, fillDailyTrend, percentage } from "./analytics.utils.js";
import type { AnalyticsOverview, AnalyticsRange } from "./analytics.types.js";
import { getDateRange } from "./analytics.utils.js";

export type AnalyticsStore = Pick<AnalyticsRepository, "countApplications" | "countByStatus" | "countSavedJobs" | "countSearches" | "applicationsPerDay">;

export class AnalyticsService {
  constructor(private readonly repository: AnalyticsStore) {}

  async overview(userId: string, label: AnalyticsRange, now = new Date()): Promise<AnalyticsOverview> {
    const range = getDateRange(label, now);
    const [applications, grouped, savedJobs, searches, daily] = await Promise.all([
      this.repository.countApplications(userId, range),
      this.repository.countByStatus(userId, range),
      this.repository.countSavedJobs(userId, range),
      this.repository.countSearches(userId, range),
      this.repository.applicationsPerDay(userId, range),
    ]);
    const statusCounts = new Map(grouped.map((item) => [item.status, item._count._all]));
    const applicationsByStatus = ANALYTICS_STATUSES.map((status) => ({ status, count: statusCounts.get(status) ?? 0 }));
    const interviews = statusCounts.get("INTERVIEW") ?? 0;
    const offers = statusCounts.get("OFFER") ?? 0;
    const rejections = statusCounts.get("REJECTED") ?? 0;
    const trendCounts = new Map(daily.map((item) => [item.date.toISOString().slice(0, 10), Number(item.count)]));
    return {
      range: { from: range.from?.toISOString() ?? null, to: range.to.toISOString(), label },
      summary: { savedJobs, applications, interviews, offers, rejections, searches, jobsDiscovered: null },
      rates: {
        applicationRate: percentage(applications, savedJobs),
        interviewRate: percentage(interviews, applications),
        offerRate: percentage(offers, applications),
        rejectionRate: percentage(rejections, applications),
      },
      applicationsByStatus,
      applicationsOverTime: range.from ? fillDailyTrend(range.from, range.to, trendCounts) : daily.map((item) => ({ date: item.date.toISOString().slice(0, 10), applications: Number(item.count) })),
    };
  }
}
