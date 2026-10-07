import type { Job, JobSearch, Prisma, PrismaClient } from "@prisma/client";
import type { NormalizedJob } from "../types/jobs.js";

export class JobRepository {
  constructor(private readonly database: PrismaClient) {}

  async upsertMany(jobs: NormalizedJob[]): Promise<Job[]> {
    const persistedJobs: Job[] = [];
    for (const job of jobs) {
      const persistedJob = await this.database.job.upsert({
        where: { source_externalId: { source: job.source, externalId: job.externalId } },
        create: job as Prisma.JobCreateInput,
        update: {
          title: job.title,
          companyName: job.companyName,
          companyUrl: job.companyUrl,
          jobUrl: job.jobUrl,
          location: job.location,
          employmentType: job.employmentType,
          workplaceType: job.workplaceType,
          description: job.description,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          salaryPeriod: job.salaryPeriod,
          postedAt: job.postedAt,
          expiresAt: job.expiresAt,
          sourceUrl: job.sourceUrl,
          rawData: job.rawData ?? undefined,
        },
      });
      persistedJobs.push(persistedJob);
    }
    return persistedJobs;
  }

  findMany(filters: {
    keyword?: string;
    location?: string;
    workplaceType?: string;
    employmentType?: string;
    source?: string;
    page: number;
    limit: number;
  }): Promise<{ jobs: Job[]; total: number }> {
    const where: Prisma.JobWhereInput = {
      title: filters.keyword ? { contains: filters.keyword, mode: "insensitive" } : undefined,
      location: filters.location ? { contains: filters.location, mode: "insensitive" } : undefined,
      workplaceType: filters.workplaceType ? { equals: filters.workplaceType, mode: "insensitive" } : undefined,
      employmentType: filters.employmentType ? { equals: filters.employmentType, mode: "insensitive" } : undefined,
      source: filters.source ? { equals: filters.source, mode: "insensitive" } : undefined,
    };
    return Promise.all([
      this.database.job.findMany({ where, orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }], skip: (filters.page - 1) * filters.limit, take: filters.limit }),
      this.database.job.count({ where }),
    ]).then(([jobs, total]) => ({ jobs, total }));
  }

  findById(id: string): Promise<Job | null> {
    return this.database.job.findUnique({ where: { id } });
  }

  listForRecommendations(limit: number): Promise<Job[]> {
    return this.database.job.findMany({ orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }], take: limit });
  }

  createSearch(userId: string, query: string, location: string | undefined, filters: Prisma.InputJsonValue): Promise<JobSearch> {
    return this.database.jobSearch.create({ data: { userId, query, location, filters } });
  }

  findSearchForUser(id: string, userId: string): Promise<JobSearch | null> {
    return this.database.jobSearch.findFirst({ where: { id, userId } });
  }

  findSearchById(id: string): Promise<JobSearch | null> {
    return this.database.jobSearch.findUnique({ where: { id } });
  }

  markSearchProcessing(id: string): Promise<JobSearch> {
    return this.database.jobSearch.update({ where: { id }, data: { processingStatus: "PROCESSING", processingStartedAt: new Date(), processingErrorCode: null } });
  }

  markSearchCompleted(id: string): Promise<JobSearch> {
    return this.database.jobSearch.update({ where: { id }, data: { processingStatus: "COMPLETED", processingCompletedAt: new Date(), processingFailedAt: null, processingErrorCode: null } });
  }

  markSearchFailed(id: string, errorCode: string): Promise<JobSearch> {
    return this.database.jobSearch.update({ where: { id }, data: { processingStatus: "FAILED", processingFailedAt: new Date(), processingErrorCode: errorCode } });
  }

  listSearches(userId: string): Promise<JobSearch[]> {
    return this.database.jobSearch.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
  }

  deleteSearch(id: string, userId: string): Promise<JobSearch | null> {
    return this.database.jobSearch.deleteMany({ where: { id, userId } }).then((result) => result.count ? this.database.jobSearch.findUnique({ where: { id } }) : null);
  }
}
