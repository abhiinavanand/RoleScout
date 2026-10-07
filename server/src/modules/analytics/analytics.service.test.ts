import { describe, expect, it, vi } from "vitest";
import { AnalyticsService } from "./analytics.service.js";

describe("AnalyticsService", () => {
  it("returns empty, valid analytics without fabricating rates", async () => {
    const repository = {
      countApplications: vi.fn().mockResolvedValue(0),
      countByStatus: vi.fn().mockResolvedValue([]),
      countSavedJobs: vi.fn().mockResolvedValue(0),
      countSearches: vi.fn().mockResolvedValue(0),
      applicationsPerDay: vi.fn().mockResolvedValue([]),
    };
    const result = await new AnalyticsService(repository).overview("user_1", "7d", new Date("2026-10-07T12:00:00Z"));
    expect(result.summary).toEqual({ savedJobs: 0, applications: 0, interviews: 0, offers: 0, rejections: 0, searches: 0, jobsDiscovered: null });
    expect(result.rates.interviewRate).toBeNull();
    expect(result.applicationsOverTime).toHaveLength(7);
  });

  it("calculates status counts and rates from the selected range", async () => {
    const repository = {
      countApplications: vi.fn().mockResolvedValue(10),
      countByStatus: vi.fn().mockResolvedValue([
        { status: "SAVED", _count: { _all: 2 } },
        { status: "INTERVIEW", _count: { _all: 3 } },
        { status: "OFFER", _count: { _all: 1 } },
        { status: "REJECTED", _count: { _all: 2 } },
      ]),
      countSavedJobs: vi.fn().mockResolvedValue(5),
      countSearches: vi.fn().mockResolvedValue(4),
      applicationsPerDay: vi.fn().mockResolvedValue([{ date: new Date("2026-10-06T00:00:00Z"), count: 2n }]),
    };
    const result = await new AnalyticsService(repository).overview("user_1", "7d", new Date("2026-10-07T12:00:00Z"));
    expect(result.rates).toEqual({ applicationRate: 200, interviewRate: 30, offerRate: 10, rejectionRate: 20 });
    expect(result.applicationsByStatus.find((item) => item.status === "INTERVIEW")?.count).toBe(3);
    expect(result.applicationsOverTime.find((item) => item.date === "2026-10-06")?.applications).toBe(2);
  });
});
