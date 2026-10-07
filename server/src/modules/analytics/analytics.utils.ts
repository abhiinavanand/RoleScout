import type { AnalyticsDateRange, AnalyticsRange } from "./analytics.types.js";

export const ANALYTICS_STATUSES = ["SAVED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"] as const;

export function getDateRange(label: AnalyticsRange, now = new Date()): AnalyticsDateRange {
  const to = new Date(now);
  if (label === "all") return { from: null, to, label };
  const days = Number(label.slice(0, -1));
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days + 1);
  from.setUTCHours(0, 0, 0, 0);
  return { from, to, label };
}

export function percentage(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : Math.round((numerator / denominator) * 100);
}

export function fillDailyTrend(from: Date, to: Date, counts: Map<string, number>): Array<{ date: string; applications: number }> {
  const result: Array<{ date: string; applications: number }> = [];
  const current = new Date(from);
  current.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setUTCHours(0, 0, 0, 0);
  while (current <= end) {
    const date = current.toISOString().slice(0, 10);
    result.push({ date, applications: counts.get(date) ?? 0 });
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return result;
}
