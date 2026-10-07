import { describe, expect, it } from "vitest";
import { fillDailyTrend, getDateRange, percentage } from "./analytics.utils.js";

describe("analytics helpers", () => {
  const now = new Date("2026-10-07T12:00:00.000Z");

  it("creates deterministic supported date ranges", () => {
    expect(getDateRange("7d", now).from?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(getDateRange("all", now).from).toBeNull();
  });

  it("returns null for rates without a denominator", () => {
    expect(percentage(2, 0)).toBeNull();
    expect(percentage(1, 3)).toBe(33);
  });

  it("fills missing trend dates with zero", () => {
    const trend = fillDailyTrend(new Date("2026-10-01T00:00:00Z"), new Date("2026-10-03T23:59:59Z"), new Map([["2026-10-02", 2]]));
    expect(trend).toEqual([
      { date: "2026-10-01", applications: 0 },
      { date: "2026-10-02", applications: 2 },
      { date: "2026-10-03", applications: 0 },
    ]);
  });
});
