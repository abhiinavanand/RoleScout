import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const jobSearchSchema = z.object({
  query: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200).optional().default(""),
  remote: z.boolean().optional(),
  employmentType: z.string().trim().max(50).optional(),
  experienceLevel: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).max(100).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const persistedJobFiltersSchema = z.object({
  keyword: z.string().trim().max(200).optional(),
  location: z.string().trim().max(200).optional(),
  workplaceType: z.string().trim().max(50).optional(),
  employmentType: z.string().trim().max(50).optional(),
  source: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).max(100).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type JobSearchParams = z.infer<typeof jobSearchSchema>;

export type NormalizedJob = {
  externalId: string;
  source: string;
  title: string;
  companyName: string;
  companyUrl: string | null;
  jobUrl: string;
  location: string | null;
  employmentType: string | null;
  workplaceType: string | null;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  postedAt: Date | null;
  expiresAt: Date | null;
  sourceUrl: string | null;
  rawData: Prisma.InputJsonValue | null;
};

export type ProviderJob = {
  externalId: string;
  title: string;
  companyName: string;
  companyUrl?: string;
  jobUrl: string;
  location?: string;
  employmentType?: string;
  workplaceType?: string;
  description?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  postedAt?: string;
  expiresAt?: string;
  sourceUrl?: string;
  rawData?: Prisma.InputJsonValue;
};

export type ProviderSearchResult = {
  jobs: ProviderJob[];
  hasNextPage: boolean;
  total?: number;
};
