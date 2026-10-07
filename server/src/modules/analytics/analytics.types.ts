import { z } from "zod";

export const analyticsRangeSchema = z.enum(["7d", "30d", "90d", "all"]).default("30d");
export type AnalyticsRange = z.infer<typeof analyticsRangeSchema>;

export type AnalyticsDateRange = {
  from: Date | null;
  to: Date;
  label: AnalyticsRange;
};

export type AnalyticsOverview = {
  range: { from: string | null; to: string; label: AnalyticsRange };
  summary: {
    savedJobs: number;
    applications: number;
    interviews: number;
    offers: number;
    rejections: number;
    searches: number;
    jobsDiscovered: number | null;
  };
  rates: {
    applicationRate: number | null;
    interviewRate: number | null;
    offerRate: number | null;
    rejectionRate: number | null;
  };
  applicationsByStatus: Array<{ status: string; count: number }>;
  applicationsOverTime: Array<{ date: string; applications: number }>;
};
