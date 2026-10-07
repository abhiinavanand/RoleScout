import type { Job } from "bullmq";
import { JobRepository } from "../repositories/job-repository.js";
import { prisma } from "../config/database.js";
import { SerpApiJobSearchProvider } from "../providers/job-search/serpapi-provider.js";
import { JobSearchService } from "../services/job-search-service.js";
import { jobDiscoveryPayloadSchema, type JobDiscoveryPayload } from "../jobs/job-payloads.js";
import { UnrecoverableError } from "bullmq";
import { AppError } from "../utils/errors.js";
import { incrementMetric } from "../observability/metrics.js";

export async function processJobDiscovery(job: Job<JobDiscoveryPayload>): Promise<void> {
  const payload = jobDiscoveryPayloadSchema.parse(job.data);
  incrementMetric("rolescout_job_search_attempts_total", { job_type: "job_discovery" });
  try {
    await new JobSearchService(new JobRepository(prisma), new SerpApiJobSearchProvider()).process(payload.searchId);
  } catch (error) {
    incrementMetric("rolescout_job_search_failures_total", { job_type: "job_discovery" });
    if (error instanceof AppError && [400, 401, 403, 404].includes(error.statusCode)) {
      throw new UnrecoverableError(error.message);
    }
    throw error;
  }
}
