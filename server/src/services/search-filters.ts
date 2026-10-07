import { z } from "zod";
import type { Prisma } from "@prisma/client";
import type { JobSearchParams } from "../types/jobs.js";

const storedSearchFiltersSchema = z.object({
  remote: z.boolean().nullable().optional(),
  employmentType: z.string().nullable().optional(),
  experienceLevel: z.string().nullable().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
}).passthrough();

type StoredSearchFilters = z.infer<typeof storedSearchFiltersSchema>;

export function toStoredSearchFilters(search: JobSearchParams): Prisma.InputJsonValue {
  return {
    ...(search.remote !== undefined ? { remote: search.remote } : {}),
    ...(search.employmentType ? { employmentType: search.employmentType } : {}),
    ...(search.experienceLevel ? { experienceLevel: search.experienceLevel } : {}),
    page: search.page,
    limit: search.limit,
  };
}

export function normalizeStoredSearchFilters(filters: unknown): Partial<Omit<JobSearchParams, "query" | "location">> {
  const parsed: StoredSearchFilters = storedSearchFiltersSchema.parse(filters);
  return {
    ...(parsed.remote !== null && parsed.remote !== undefined ? { remote: parsed.remote } : {}),
    ...(parsed.employmentType !== null && parsed.employmentType !== undefined ? { employmentType: parsed.employmentType } : {}),
    ...(parsed.experienceLevel !== null && parsed.experienceLevel !== undefined ? { experienceLevel: parsed.experienceLevel } : {}),
    ...(parsed.page !== undefined ? { page: parsed.page } : {}),
    ...(parsed.limit !== undefined ? { limit: parsed.limit } : {}),
  };
}
