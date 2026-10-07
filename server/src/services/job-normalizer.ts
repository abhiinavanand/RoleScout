import type { NormalizedJob, ProviderJob } from "../types/jobs.js";

export function normalizeProviderJob(job: ProviderJob, source: string): NormalizedJob {
  return {
    externalId: clean(job.externalId) || fingerprintJob(job),
    source,
    title: clean(job.title) || "Untitled job",
    companyName: clean(job.companyName) || "Unknown company",
    companyUrl: normalizeUrl(job.companyUrl),
    jobUrl: normalizeUrl(job.jobUrl) ?? "",
    location: cleanNullable(job.location),
    employmentType: cleanNullable(job.employmentType),
    workplaceType: cleanNullable(job.workplaceType),
    description: clean(job.description),
    salaryMin: finiteNumber(job.salaryMin),
    salaryMax: finiteNumber(job.salaryMax),
    salaryCurrency: cleanNullable(job.salaryCurrency),
    salaryPeriod: cleanNullable(job.salaryPeriod),
    postedAt: parseDate(job.postedAt),
    expiresAt: parseDate(job.expiresAt),
    sourceUrl: normalizeUrl(job.sourceUrl),
    rawData: job.rawData ?? null,
  };
}

export function deduplicateJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const identity = `${job.source}:${job.externalId}`;
    const fallback = `${job.source}:${fingerprintJob(job)}`;
    if (seen.has(identity) || seen.has(fallback)) return false;
    seen.add(identity);
    seen.add(fallback);
    return true;
  });
}

export function fingerprintJob(job: Pick<NormalizedJob, "companyName" | "title" | "location" | "jobUrl"> | ProviderJob): string {
  return [job.companyName, job.title, job.location ?? "", job.jobUrl]
    .map((value) => value.trim().toLowerCase().replace(/\s+/g, " "))
    .join("|");
}

function clean(value: string | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function cleanNullable(value: string | undefined): string | null {
  const cleaned = clean(value);
  return cleaned || null;
}

function normalizeUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function finiteNumber(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
