import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import { JobRepository } from "../repositories/job-repository.js";
import { jobSearchSchema, type JobSearchParams, type NormalizedJob } from "../types/jobs.js";
import { deduplicateJobs, normalizeProviderJob } from "./job-normalizer.js";
import { planJobSearch } from "./search-planner.js";
import { normalizeStoredSearchFilters, toStoredSearchFilters } from "./search-filters.js";
import type { JobSearchProvider } from "../providers/job-search/job-search-provider.js";

type JobSearchRepository = {
  createSearch: (userId: string, query: string, location: string | undefined, filters: Prisma.InputJsonValue) => Promise<{ id: string; processingStatus: string }>;
  findSearchById: (id: string) => Promise<{ id: string; query: string; location: string | null; filters: Prisma.JsonValue } | null>;
  markSearchProcessing: (id: string) => Promise<unknown>;
  upsertMany: (jobs: NormalizedJob[]) => Promise<Array<{ id: string; title: string; jobUrl: string }>>;
  markSearchCompleted: (id: string) => Promise<unknown>;
};

export class JobSearchService {
  constructor(
    private readonly repository: JobSearchRepository = new JobRepository(prisma),
    private readonly provider: JobSearchProvider,
  ) {}

  async search(userId: string, input: JobSearchParams): Promise<{ jobs: Array<{ id: string; title: string; jobUrl: string }>; page: number; limit: number; hasNextPage: boolean }> {
    const search = await this.createPendingSearch(userId, input);
    const result = await this.process(search.id);
    return result;
  }

  async createPendingSearch(userId: string, input: JobSearchParams) {
    const plannedSearch = planJobSearch(jobSearchSchema.parse(input));
    const filters: Prisma.InputJsonValue = toStoredSearchFilters(plannedSearch);
    return this.repository.createSearch(userId, plannedSearch.query, plannedSearch.location || undefined, filters);
  }

  async process(searchId: string): Promise<{ jobs: Array<{ id: string; title: string; jobUrl: string }>; page: number; limit: number; hasNextPage: boolean }> {
    const search = await this.repository.findSearchById(searchId);
    if (!search) throw new Error("Search not found.");
    await this.repository.markSearchProcessing(searchId);
    const plannedSearch = jobSearchSchema.parse({
      query: search.query,
      location: search.location ?? "",
      ...normalizeStoredSearchFilters(search.filters),
    });
    const providerResult = await this.provider.searchJobs(plannedSearch);
    const normalizedJobs = deduplicateJobs(providerResult.jobs.map((job) => normalizeProviderJob(job, this.provider.source)).filter((job) => job.jobUrl));
    const jobs = await this.repository.upsertMany(normalizedJobs);
    await this.repository.markSearchCompleted(searchId);
    return { jobs, page: plannedSearch.page, limit: plannedSearch.limit, hasNextPage: providerResult.hasNextPage };
  }
}
