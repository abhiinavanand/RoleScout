import { apiRequest } from "./client";

export type AnalyticsRange = "7d" | "30d" | "90d" | "all";
export type AnalyticsOverview = {
  range: { from: string | null; to: string; label: AnalyticsRange };
  summary: { savedJobs: number; applications: number; interviews: number; offers: number; rejections: number; searches: number; jobsDiscovered: number | null };
  rates: { applicationRate: number | null; interviewRate: number | null; offerRate: number | null; rejectionRate: number | null };
  applicationsByStatus: Array<{ status: string; count: number }>;
  applicationsOverTime: Array<{ date: string; applications: number }>;
};
export const getOverview = (range: AnalyticsRange) => apiRequest<AnalyticsOverview>(`/analytics/overview?range=${range}`);
