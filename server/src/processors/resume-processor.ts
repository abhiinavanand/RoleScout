import type { Job } from "bullmq";
import { ResumeService } from "../services/resume-service.js";
import { ResumeRepository } from "../repositories/resume-repository.js";
import { prisma } from "../config/database.js";
import { resumeJobPayloadSchema, type ResumeJobPayload } from "../jobs/job-payloads.js";
import { UnrecoverableError } from "bullmq";
import { AppError } from "../utils/errors.js";
import { incrementMetric } from "../observability/metrics.js";

export async function processResumeJob(job: Job<ResumeJobPayload>): Promise<void> {
  const payload = resumeJobPayloadSchema.parse(job.data);
  incrementMetric("rolescout_resume_processing_attempts_total", { job_type: "resume_processing" });
  try {
    await new ResumeService(new ResumeRepository(prisma)).process(payload.resumeId);
  } catch (error) {
    incrementMetric("rolescout_resume_processing_failures_total", { job_type: "resume_processing" });
    if (error instanceof AppError && [400, 404, 422].includes(error.statusCode)) {
      throw new UnrecoverableError(error.message);
    }
    throw error;
  }
}
